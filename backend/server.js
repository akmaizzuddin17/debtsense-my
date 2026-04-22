import express from 'express';
import cors from 'cors';
import { VertexAI } from '@google-cloud/vertexai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

console.log('DebtSense MY backend — Gemini 2.5 Flash via Vertex AI');

const vertexAI = new VertexAI({
  project: 'gen-lang-client-0167842911',
  location: 'us-central1',
});
const getGeminiModel = () => vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function parseJSON(text) {
  const clean = text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json|```/g, '')
    .trim();
  try { return JSON.parse(clean); } catch {}
  const start = clean.search(/[{[]/);
  if (start !== -1) {
    const opener = clean[start], closer = opener === '{' ? '}' : ']';
    let depth = 0, inString = false, escape = false;
    for (let i = start; i < clean.length; i++) {
      const ch = clean[i];
      if (escape)                  { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true;  continue; }
      if (ch === '"')              { inString = !inString; continue; }
      if (inString)                continue;
      if (ch === opener) depth++;
      if (ch === closer && --depth === 0) {
        try { return JSON.parse(clean.slice(start, i + 1)); } catch {}
      }
    }
  }
  throw new Error(`Invalid JSON from LLM: ${clean.slice(0, 120)}`);
}

async function callGemini(prompt, retries = 3) {
  const model = getGeminiModel();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Agent timed out after 60s')), 60000));
      const req = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
      const result = await Promise.race([model.generateContent(req), timeout]);
      const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
        ?? result.response?.text?.()
        ?? '';
      return parseJSON(text);
    } catch (err) {
      const msg = err.message || '';
      const is429 = msg.includes('429') || msg.includes('depleted') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      if (is429) throw new Error('GEMINI_QUOTA: Gemini API quota exceeded. Please get a new free API key at aistudio.google.com and update your .env file.');
      const is503 = msg.includes('503') || msg.includes('high demand') || msg.includes('Service Unavailable') || msg.includes('overloaded');
      if (is503 && attempt < retries) {
        console.log(`[Retry ${attempt}/${retries}] 503 — waiting ${attempt * 3}s...`);
        await new Promise(r => setTimeout(r, attempt * 3000));
        continue;
      }
      throw err;
    }
  }
}

async function callAgent(prompt) {
  return callGemini(prompt);
}

// ─── Server-side post-processing (never trust LLM for pure math) ──────────
const DEBT_NAMES = {
  car_loan: 'Car Loan', housing_loan: 'Housing Loan', ptptn: 'PTPTN',
  credit_card_min: 'Credit Card', personal_loan: 'Personal Loan', other_loan: 'Other Loan',
};

function fixDSR(data, enriched) {
  // Recompute all numbers server-side — AI is unreliable for arithmetic
  const pct = enriched.totalMonthlyIncome > 0
    ? (enriched.totalMonthlyDebtPayments / enriched.totalMonthlyIncome) * 100 : 0;

  data.dsr_percentage      = parseFloat(pct.toFixed(2));
  data.monthly_debt_total  = enriched.totalMonthlyDebtPayments;
  data.monthly_income_total = enriched.totalMonthlyIncome;
  data.headroom_rm         = Math.max(0, Math.round(0.60 * enriched.totalMonthlyIncome - enriched.totalMonthlyDebtPayments));
  data.headroom_percentage = parseFloat(Math.max(0, 60 - pct).toFixed(2));
  // Enforce only valid status values
  data.dsr_status = pct >= 60 ? 'DANGER' : pct >= 40 ? 'WARNING' : 'SAFE';

  // Compute biggest debt category server-side — never let AI guess from expenses
  const top = Object.entries(enriched.debts || {})
    .filter(([, v]) => Number(v) > 0)
    .sort(([, a], [, b]) => Number(b) - Number(a))[0];
  data.biggest_debt_category = top ? (DEBT_NAMES[top[0]] || top[0].replace(/_/g, ' ')) : 'None';

  return data;
}

function fixRisk(data, enriched, dsr) {
  // Enforce valid risk level strings
  const MAP = { CAUTION: 'MEDIUM', MODERATE: 'MEDIUM', SEVERE: 'HIGH', EXTREME: 'HIGH', CRITICAL: 'HIGH' };
  const normalized = (data.overall_risk || '').toUpperCase();
  const valid = ['LOW', 'MEDIUM', 'HIGH'];
  data.overall_risk = valid.includes(normalized) ? normalized : (MAP[normalized] || null);

  // If risk_score looks implausible, recompute it
  const score = Number(data.risk_score);
  if (!score || score < 2 || score > 100) {
    const dsrF  = Math.min((dsr.dsr_percentage / 60) * 40, 40);
    const savF  = Math.max(0, (20 - (Number(data.savings_rate_percentage) || 0)) * 1.5);
    const emF   = (Number(data.emergency_fund_months) || 0) < 3 ? 20 : 0;
    data.risk_score = Math.min(100, Math.round(dsrF + savF + emF));
  }

  // Derive risk level from score if still missing
  if (!data.overall_risk) {
    data.overall_risk = data.risk_score >= 65 ? 'HIGH' : data.risk_score >= 35 ? 'MEDIUM' : 'LOW';
  }

  // Server-side savings rate (more reliable than LLM arithmetic)
  if (enriched.totalMonthlyIncome > 0) {
    const serverRate = (enriched.monthlySavings / enriched.totalMonthlyIncome) * 100;
    // Only override if AI value is clearly wrong
    if (!data.savings_rate_percentage || Math.abs(data.savings_rate_percentage - serverRate) > 8) {
      data.savings_rate_percentage = parseFloat(serverRate.toFixed(1));
    }
  }

  // Emergency fund: compute from actual current savings if provided
  if (enriched.currentSavings > 0 && enriched.totalMonthlyExpenses > 0) {
    data.emergency_fund_months = parseFloat((enriched.currentSavings / enriched.totalMonthlyExpenses).toFixed(1));
  }

  return data;
}

function fixInvestment(data, enriched) {
  // Always respect what the user said they want to invest
  if (enriched.monthlyInvestmentBudget > 0) {
    data.investable_amount_monthly = enriched.monthlyInvestmentBudget;
  } else if (!data.investable_amount_monthly || data.investable_amount_monthly < 1) {
    data.investable_amount_monthly = Math.max(0, Math.round(enriched.monthlySavings * 0.5));
  }

  // Drop incomplete recommendations (LLM sometimes returns blank 4th entry)
  if (data.recommendations) {
    data.recommendations = data.recommendations.filter(r => r.name && String(r.name).trim().length > 0);
  }

  // Scale recommendation amounts to fit investable budget
  const budget = data.investable_amount_monthly;
  if (data.recommendations?.length && budget > 0) {
    // Distribute budget across recommendations proportionally to their suggested amounts
    const totalSuggested = data.recommendations.reduce((s, r) => s + (r.monthly_amount_rm || 0), 0);
    if (totalSuggested > budget || totalSuggested === 0) {
      data.recommendations = data.recommendations.map((r, i) => ({
        ...r,
        monthly_amount_rm: i === 0
          ? Math.round(budget * 0.5)
          : Math.round(budget * 0.5 / (data.recommendations.length - 1)),
      }));
    }
  }

  return data;
}

// ─── Agents ───────────────────────────────────────────────────────────────

async function agentDSRAnalyzer(profile) {
  const debtItems = Object.entries(profile.debts || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => `${DEBT_NAMES[k] || k}: RM ${v}`)
    .join(', ') || 'no debts';
  const pct = profile.totalMonthlyIncome > 0
    ? ((profile.totalMonthlyDebtPayments / profile.totalMonthlyIncome) * 100).toFixed(1) : 0;

  // All numbers are computed server-side in fixDSR — only ask LLM for the summary text
  const ai = await callAgent(
    `Malaysian financial analyst. Income RM ${profile.totalMonthlyIncome}/mo. Debts: ${debtItems}. DSR is ${pct}% (BNM limit 60%). Write ONE short sentence (under 20 words) for analysis_summary.
Return JSON only: {"analysis_summary":""}`,
    600,
  );
  return { analysis_summary: ai?.analysis_summary || '' };
}

async function agentRiskProfiler(profile, dsr) {
  const totalExp = Object.values(profile.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const savRate  = profile.totalMonthlyIncome > 0
    ? ((profile.monthlySavings / profile.totalMonthlyIncome) * 100).toFixed(1) : 0;

  // Numbers are fixed server-side — only ask LLM for text/list fields
  const ai = await callAgent(
    `Malaysian personal finance risk analyst. Age ${profile.age}, ${profile.lifeStage}. Income RM ${profile.totalMonthlyIncome}, DSR ${dsr.dsr_percentage}% (${dsr.dsr_status}), savings rate ${savRate}%.
overall_risk: one of LOW/MEDIUM/HIGH. risk_score: 0-100. Keep each list item under 12 words. Max 3 items per list.
Return JSON only:
{"overall_risk":"LOW","risk_score":0,"risky_expense_categories":[],"risk_factors":[],"positive_factors":[],"risk_summary":""}`,
    1200,
  );
  return {
    overall_risk:             ai?.overall_risk || 'MEDIUM',
    risk_score:               ai?.risk_score   || 0,
    savings_rate_percentage:  parseFloat(savRate),
    savings_benchmark_gap:    Math.max(0, 20 - parseFloat(savRate)),
    emergency_fund_months:    parseFloat((profile.currentSavings / (totalExp || 1)).toFixed(1)),
    risky_expense_categories: ai?.risky_expense_categories || [],
    risk_factors:             ai?.risk_factors   || [],
    positive_factors:         ai?.positive_factors || [],
    risk_summary:             ai?.risk_summary   || '',
  };
}

async function agentPurchaseAdvisor(profile, dsr, risk, item) {
  return callAgent(`Malaysian financial advisor. Purchase decision for: "${item.item}" costing RM ${item.estimatedCost} via ${item.paymentMethod}.
User: Income RM ${profile.totalMonthlyIncome}, DSR ${dsr.dsr_percentage}% (${dsr.dsr_status}), Risk ${risk.overall_risk}, Monthly savings RM ${profile.monthlySavings}, Balance RM ${profile.currentSavings}.
verdict MUST be exactly one of: BUY, WAIT, AVOID
IMPORTANT: action_steps MUST contain 3-4 very specific steps the user can take RIGHT NOW to eventually afford this purchase — e.g. "Cut food expenses from RM X to RM Y to save RM Z/mo", "Pay off personal loan in 3 months to free RM X/mo". Be concrete with numbers.
smarter_alternatives: 2-3 specific alternatives to consider.
Return JSON only:
{"verdict":"WAIT","confidence":0,"affordability_score":0,"months_to_save":0,"monthly_impact_rm":0,"new_dsr_if_financed":0,"reasoning":"","smarter_alternatives":[],"action_steps":[]}`);
}

async function agentInvestmentMatchmaker(profile, dsr, risk) {
  const budget = profile.monthlyInvestmentBudget || profile.monthlySavings;
  return callAgent(`Malaysian investment advisor.
User: Income RM ${profile.totalMonthlyIncome}, available to invest RM ${budget}/mo, Risk appetite ${profile.riskAppetite}, Age ${profile.age}, ${profile.lifeStage}, Financial risk ${risk.overall_risk}.
investable_amount_monthly MUST be exactly RM ${budget} (that is the user's budget).
Each recommendation's monthly_amount_rm MUST be a portion of RM ${budget} (all 4 recommendations combined should not exceed RM ${budget}).
Malaysian options: ASB, EPF i-Saraan, unit trusts, REITs, gold (Public Gold), Bursa stocks, Tabung Haji, fixed deposits, P2P lending (Funding Societies).
investment_readiness MUST be exactly one of: READY, PARTIALLY READY, NOT READY
Return JSON only:
{"investable_amount_monthly":${budget},"investment_readiness":"PARTIALLY READY","recommendations":[{"rank":1,"name":"","type":"","platform":"","monthly_amount_rm":0,"expected_return":"","risk_level":"Low","why_suitable":"","how_to_start":"","getting_started_steps":[]}],"total_monthly_investment":0,"projected_1year_rm":0,"investment_summary":""}`);
}

async function agentRescuePlanner(profile, dsr, risk, investment, purchase) {
  const purchaseCtx = purchase ? `Purchase: ${purchase.verdict}. ` : '';
  return callAgent(`Malaysia personal finance coach. 3-month roadmap.
Income RM ${profile.totalMonthlyIncome}, DSR ${dsr.dsr_percentage}% (${dsr.dsr_status}), Risk ${risk.overall_risk}, Life stage ${profile.lifeStage}.
${purchaseCtx}
IMPORTANT: Keep EVERY action under 12 words. Keep arrays to max 3 items each.
Financial Twin archetype MUST be one of: Saver, Spender, Builder, Survivor, Climber, Hustler.
Return JSON only:
{"financial_twin":{"name":"The Cautious Climber","tagline":"Short tagline here","archetype":"Climber"},"month_1":{"theme":"Stabilise","actions":["Action 1","Action 2","Action 3"]},"month_2":{"theme":"Build","actions":["Action 1","Action 2","Action 3"]},"month_3":{"theme":"Grow","actions":["Action 1","Action 2","Action 3"]},"quick_wins":["Win 1","Win 2","Win 3"],"malaysian_resources":["AKPK 1800-88-2575","EPF i-Akaun kwsp.gov.my"],"projected_dsr_month3":0,"projected_savings_month3":0,"overall_message":"One sentence message."}`);
}

async function agentScamDetector(offerText, userProfile) {
  return callAgent(`You are Malaysia's top digital fraud analyst. Perform a 3-dimension forensic audit on this message.

MESSAGE TO ANALYZE:
"${offerText.slice(0, 800)}"

=== DIMENSION 1: TECHNICAL (Domain & Link Check) ===
- Official Malaysian government domains MUST end in .gov.my (not .me .net .info .xyz or deceptive names)
- Official bank domains: maybank2u.com.my, cimbclicks.com.my, hongleongbank.com, not variations
- Check all URLs in the message: HTTP (not HTTPS) = red flag; newly-registered-looking domain = red flag
- Sender email domains that mimic official ones (e.g. lhdn-support-portal.me, bnm-info.net) = HIGH risk

=== DIMENSION 2: PSYCHOLOGICAL (Social Engineering) ===
Detect these BM/EN urgency and manipulation phrases:
- BM: "dalam tempoh 24 jam", "segera", "peringatan terakhir", "akan dilupuskan", "akaun anda disekat", "tangkap segera", "bayar sekarang", "sahkan identiti", "wang anda dalam risiko"
- EN: "act now", "last warning", "account suspended", "verify immediately", "final notice", "24 hours"
- False authority: impersonating LHDN, BNM, PDRM, EPF, Jabatan Imigresen, Mahkamah
- Fear tactics, prize claims, unexpected refunds/winnings, love investment

=== DIMENSION 3: STRUCTURAL (Request Pattern) ===
- Asking for personal IC / bank account / TAC / OTP
- Requesting upfront fees, "processing fee", "deposit" before receiving benefit
- Unrealistic ROI: >10%/month, guaranteed returns, "risk-free"
- Fake job offers requiring deposit, work-from-home payment first schemes
- Ah Long / illegal loan characteristics

Known Malaysian scam categories: Macau Scam (JDAS), Skim Cepat Kaya, E-Commerce Review Job, Phantom Job, LHDN Phishing, BNM Impersonation, Love Scam Investment, Ah Long.

verdict MUST be exactly one of: LIKELY_SCAM, SUSPICIOUS, LEGITIMATE
risk_level MUST be exactly one of: HIGH, MEDIUM, LOW
Return JSON only:
{"verdict":"LIKELY_SCAM","confidence":0,"risk_level":"HIGH","red_flags":[],"legitimate_indicators":[],"similar_known_scam":"","recommended_action":"","report_to":"BNMTELELINK 1-300-88-5465","warning_message":"","analysis_dimensions":[{"dimension":"Technical","markers_found":[],"risk":"HIGH","explanation":""},{"dimension":"Psychological","markers_found":[],"risk":"HIGH","explanation":""},{"dimension":"Structural","markers_found":[],"risk":"MEDIUM","explanation":""}],"language_detected":"EN"}`);
}

// ─── Shield Score (server-side, never trust LLM for arithmetic) ──────────────
function calculateShieldScore(dsr, risk, investment, plan) {
  const dsrPct    = dsr?.dsr_percentage || 0;
  const riskScore = risk?.risk_score    || 50;

  const dsrPenalty  = Math.min(30, (dsrPct / 60) * 30);
  const riskPenalty = Math.min(25, (riskScore / 100) * 25);

  const savingsRate = risk?.savings_rate_percentage || 0;
  const savingsPenalty = savingsRate >= 20 ? 0
    : savingsRate >= 10 ? 10
    : savingsRate >= 5  ? 16
    : 20;

  const emergencyMonths  = risk?.emergency_fund_months || 0;
  const liquidityPenalty = emergencyMonths >= 6 ? 0
    : emergencyMonths >= 3 ? 4
    : emergencyMonths >= 1 ? 7
    : 10;

  const scamPenalty = Math.min(15, ((risk?.scam_vulnerability_score || 50) / 100) * 15);

  const raw   = 100 - dsrPenalty - riskPenalty - savingsPenalty - liquidityPenalty - scamPenalty;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  const level = score >= 85 ? 'PROTECTED' : score >= 70 ? 'GUARDED' : score >= 40 ? 'MODERATE' : 'CRITICAL';
  const levelColor = score >= 85 ? '#30d158' : score >= 70 ? '#ffd60a' : score >= 40 ? '#ff9f0a' : '#ff3b30';

  const breakdown = [];

  if (dsrPenalty > 20) breakdown.push({
    factor: 'Critical Debt Load', impact: 'HIGH', penalty: Math.round(dsrPenalty),
    explanation: `Your DSR is ${dsrPct.toFixed(1)}% — dangerously close to BNM's 60% limit. Heavy debt commitments signal financial desperation to scammers.`,
    scam_link: 'Predatory lenders and Ah Long target high-DSR individuals with "instant loan" offers.',
    fix: `Reduce monthly debt payments by RM ${Math.round((dsr?.monthly_debt_total || 0) * 0.1)} to improve this by 5 points.`,
  });
  else if (dsrPenalty > 10) breakdown.push({
    factor: 'Elevated Debt Load', impact: 'MEDIUM', penalty: Math.round(dsrPenalty),
    explanation: `Your DSR is ${dsrPct.toFixed(1)}%. Manageable but leaves you exposed to financial stress scams.`,
    scam_link: 'Fake debt consolidation schemes often target people in your DSR range.',
    fix: 'Maintain current payments and avoid new loans for 3 months.',
  });

  if (savingsPenalty >= 16) breakdown.push({
    factor: 'Critically Low Savings', impact: 'HIGH', penalty: savingsPenalty,
    explanation: `You save only ${savingsRate.toFixed(1)}% of income. A financial emergency would leave you with no buffer.`,
    scam_link: 'Low savings creates "urgency vulnerability" — scammers exploit panic (fake summons, frozen account calls).',
    fix: 'Even saving RM 200/month more would improve this score by 6 points.',
  });
  else if (savingsPenalty >= 10) breakdown.push({
    factor: 'Low Savings Rate', impact: 'MEDIUM', penalty: savingsPenalty,
    explanation: `Savings rate of ${savingsRate.toFixed(1)}% is below the 20% Malaysian benchmark.`,
    scam_link: 'Below-benchmark savers are 2× more likely to fall for fake investment promises.',
    fix: 'Increase to 15% savings rate to gain 5 shield points.',
  });

  if (liquidityPenalty >= 7) breakdown.push({
    factor: 'Insufficient Emergency Fund', impact: 'HIGH', penalty: liquidityPenalty,
    explanation: `Only ${emergencyMonths} month(s) of expenses covered. You have no financial cushion.`,
    scam_link: 'Scammers exploit financial urgency — "pay now or lose everything" tactics work on people with no buffer.',
    fix: 'Build RM 3,000 emergency fund first. This adds 6 shield points.',
  });

  if (riskPenalty > 15) breakdown.push({
    factor: 'High Overall Financial Risk', impact: 'HIGH', penalty: Math.round(riskPenalty),
    explanation: `Risk score of ${riskScore}/100 reflects multiple financial vulnerabilities compounding each other.`,
    scam_link: 'High financial stress correlates directly with scam susceptibility — stressed minds make faster, worse decisions.',
    fix: 'Addressing your top 2 risk factors reduces this penalty by up to 10 points.',
  });

  if (scamPenalty > 8) breakdown.push({
    factor: 'High Scam Targeting Profile', impact: 'HIGH', penalty: Math.round(scamPenalty),
    explanation: 'Your financial profile matches patterns scammers actively search for on social media and phone lists.',
    scam_link: 'You match the profile for: ' + (risk?.scam_types_at_risk || ['predatory loans', 'fake investments']).slice(0, 2).join(', '),
    fix: 'Completing the 3-month hardening plan reduces scam vulnerability by an estimated 35%.',
  });

  const strengths = [];
  if (dsrPct < 30) strengths.push({ factor: 'Low Debt Burden', explanation: 'Your DSR is well within safe range. Scammers cannot exploit debt desperation.' });
  if (savingsRate >= 20) strengths.push({ factor: 'Strong Savings Habit', explanation: 'Saving 20%+ means you have financial security — urgency scam tactics are less effective.' });
  if (emergencyMonths >= 6) strengths.push({ factor: 'Solid Emergency Buffer', explanation: '6+ months emergency fund. You can handle financial shocks without panic decisions.' });
  if (investment?.investment_readiness === 'READY') strengths.push({ factor: 'Investment Ready', explanation: 'Financial stability means you can evaluate real investments — not fall for fake ones.' });

  const maxPossibleGain = breakdown.reduce((sum, b) => sum + b.penalty, 0);
  const projectedScore  = Math.min(100, score + Math.round(maxPossibleGain * 0.7));

  return {
    score, level, levelColor, breakdown, strengths, maxPossibleGain, projectedScore,
    summary: `Your financial profile has ${breakdown.length} vulnerability gap${breakdown.length !== 1 ? 's' : ''} that digital scammers actively exploit. ${strengths.length > 0 ? `However, ${strengths.length} strength${strengths.length !== 1 ? 's' : ''} are protecting you.` : `Completing the 3-month hardening plan can raise your score to ${projectedScore}.`}`,
  };
}

// ─── Main Analysis Endpoint ───────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  try {
    const { profile, purchaseItem } = req.body;
    const totalDebt     = Object.values(profile.debts    || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalIncome   = Object.values(profile.income   || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalExpenses = Object.values(profile.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const enriched = {
      ...profile,
      totalMonthlyIncome:       totalIncome,
      totalMonthlyDebtPayments: totalDebt,
      totalMonthlyExpenses:     totalExpenses,
      monthlySavings:           Math.max(0, totalIncome - totalDebt - totalExpenses),
      currentSavings:           Number(profile.currentSavings)         || 0,
      monthlySavingsTarget:     Number(profile.monthlySavingsTarget)   || 0,
      monthlyInvestmentBudget:  Number(profile.monthlyInvestmentBudget)|| 0,
    };

    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (stage, data) => res.write(`data: ${JSON.stringify({ stage, data })}\n\n`);
    // Fault-tolerant wrapper — one agent failing must not crash the whole pipeline
    const safe = async (fn, fallback) => { try { return await fn() } catch (e) { console.warn('[Agent fallback]', e.message.slice(0, 80)); return fallback } };

    send('status', { message: 'Scanning financial threat surface...' });
    const dsrRaw  = await safe(() => agentDSRAnalyzer(enriched), {});
    const dsrData = fixDSR(dsrRaw, enriched);
    send('dsr', dsrData);

    send('status', { message: 'Running vulnerability assessment...' });
    const riskRaw  = await safe(() => agentRiskProfiler(enriched, dsrData), {});
    const riskData = fixRisk(riskRaw, enriched, dsrData);
    send('risk', riskData);

    send('status', { message: 'Auditing purchase intel & matching defence portfolio...' });
    const [purchaseRaw, investmentRaw] = await Promise.all([
      purchaseItem?.item
        ? safe(() => agentPurchaseAdvisor(enriched, dsrData, riskData, purchaseItem), null)
        : Promise.resolve(null),
      safe(() => agentInvestmentMatchmaker(enriched, dsrData, riskData), { recommendations: [], investable_amount_monthly: 0, investment_readiness: 'NOT READY' }),
    ]);
    const purchaseData   = purchaseRaw || null;
    const investmentData = fixInvestment(investmentRaw, enriched);
    if (purchaseData) send('purchase', purchaseData);
    send('investment', investmentData);

    send('status', { message: 'Generating 3-month hardening roadmap...' });
    const planData = await safe(() => agentRescuePlanner(enriched, dsrData, riskData, investmentData, purchaseData), {
      financial_twin: { name: 'The Steady Builder', tagline: 'Building wealth one step at a time', archetype: 'Builder' },
      month_1: { theme: 'Stabilise', actions: ['Review all subscriptions and cut unused ones', 'Set up auto-transfer to savings account', 'List all debts by interest rate'] },
      month_2: { theme: 'Build',     actions: ['Start EPF i-Saraan top-up if self-employed', 'Open ASNB account for unit trust investment', 'Negotiate lower rates with lenders'] },
      month_3: { theme: 'Grow',      actions: ['Review investment portfolio performance', 'Increase savings rate by 2%', 'Consult AKPK if DSR above 60%'] },
      quick_wins: ['Check CCRIS report for free at BNM', 'Enable e-Penyata for paperless EPF', 'Use Touch n Go for toll savings'],
      malaysian_resources: ['AKPK 1800-88-2575 — free debt counselling', 'EPF i-Akaun at kwsp.gov.my', 'BNM LINK at bnmlink.bnm.gov.my'],
      projected_dsr_month3: 0,
      projected_savings_month3: 0,
      overall_message: 'Every ringgit saved today is a step toward financial freedom.',
    });
    send('plan', planData);

    send('status', { message: 'Computing Financial Shield Score...' });
    const shieldData = calculateShieldScore(dsrData, riskData, investmentData, planData);
    send('shield', shieldData);

    send('complete', { message: 'Done!' });
    res.end();
  } catch (err) {
    console.error('[Agent Error]', err.message);
    if (res.headersSent) {
      try { res.write(`data: ${JSON.stringify({ stage: 'error', data: { message: err.message } })}\n\n`); res.end(); } catch (_) {}
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ─── Agent 7: Tax Relief & Zakat Optimizer ───────────────────────────────

async function agentTaxZakat(enriched) {
  const annual       = enriched.totalMonthlyIncome * 12;
  const medAnnual    = (Number(enriched.expenses?.medical) || 0) * 12;
  const lifeAnnual   = ((Number(enriched.expenses?.entertainment) || 0) + (Number(enriched.expenses?.subscriptions) || 0)) * 12;
  const epfAnnual    = Math.min(Math.round(enriched.totalMonthlyIncome * 0.11) * 12, 4000);
  // Compute all numbers server-side — never trust local LLM for math
  const selfRelief   = 9000;
  const medClaim     = Math.min(medAnnual, 8000);
  const lifeClaim    = Math.min(lifeAnnual, 2500);
  const epfClaim     = Math.min(epfAnnual, 4000);
  const totalRelief  = selfRelief + medClaim + lifeClaim + epfClaim;
  const chargeable   = Math.max(0, annual - totalRelief);
  const taxPayable   = chargeable <= 5000 ? 0
    : chargeable <= 20000  ? Math.round((chargeable - 5000) * 0.01)
    : chargeable <= 35000  ? Math.round(150  + (chargeable - 20000) * 0.03)
    : chargeable <= 50000  ? Math.round(600  + (chargeable - 35000) * 0.06)
    : chargeable <= 70000  ? Math.round(1500 + (chargeable - 50000) * 0.11)
    : chargeable <= 100000 ? Math.round(3700 + (chargeable - 70000) * 0.19)
    : Math.round(9400 + (chargeable - 100000) * 0.25);
  const bracket      = chargeable <= 5000 ? '0%' : chargeable <= 20000 ? '1%' : chargeable <= 35000 ? '3%' : chargeable <= 50000 ? '6%' : chargeable <= 70000 ? '11%' : chargeable <= 100000 ? '19%' : '25%';
  const zakatAnnual  = annual > 23000 ? Math.round(annual * 0.025) : 0;
  const missedRelief = Math.max(0, 8000 - medClaim) + Math.max(0, 2500 - lifeClaim) + 3000 + 3000;

  // Ask AI only for the text fields — not numbers
  return callAgent(`Malaysian LHDN tax advisor. Generate ONLY text suggestions (no math needed).
User: Age ${enriched.age}, ${enriched.lifeStage}, annual income RM ${annual}.
Medical spending RM ${medAnnual}/yr. Lifestyle spending RM ${lifeAnnual}/yr. EPF RM ${epfAnnual}/yr.
Unclaimed reliefs: Medical insurance (RM3000 cap unused), Life insurance (RM3000 cap unused), Medical gap RM ${Math.max(0,8000-medClaim)}, Lifestyle gap RM ${Math.max(0,2500-lifeClaim)}.
Write 2 reallocation_suggestions, 5 lhdn_checklist items, 3 tax_tips. Keep each under 15 words.
Return JSON only:
{"reallocation_suggestions":["suggestion 1","suggestion 2"],"lhdn_checklist":["item 1","item 2","item 3","item 4","item 5"],"tax_tips":["tip 1","tip 2","tip 3"],"summary":"One sentence summary."}`, 1000)
    .then(ai => ({
      annual_income_estimate:      annual,
      estimated_chargeable_income: chargeable,
      estimated_tax_payable_rm:    taxPayable,
      tax_bracket:                 bracket,
      total_relief_amount:         totalRelief,
      missed_relief_rm:            missedRelief,
      relief_items: [
        { category: 'Self & Dependants', claimed_rm: 9000,     max_rm: 9000, gap_rm: 0,                        status: 'MAXED',   tip: 'Auto-applied every year' },
        { category: 'Medical Expenses',  claimed_rm: medClaim,  max_rm: 8000, gap_rm: Math.max(0,8000-medClaim),  status: medClaim  >= 8000 ? 'MAXED' : medClaim > 0 ? 'PARTIAL' : 'UNCLAIMED', tip: 'Clinic receipts, hospital bills, dental' },
        { category: 'Lifestyle',         claimed_rm: lifeClaim, max_rm: 2500, gap_rm: Math.max(0,2500-lifeClaim), status: lifeClaim >= 2500 ? 'MAXED' : lifeClaim > 0 ? 'PARTIAL' : 'UNCLAIMED', tip: 'Books, gym, gadgets, internet bills' },
        { category: 'EPF',               claimed_rm: epfClaim,  max_rm: 4000, gap_rm: Math.max(0,4000-epfClaim),  status: epfClaim  >= 4000 ? 'MAXED' : epfClaim  > 0 ? 'PARTIAL' : 'UNCLAIMED', tip: 'Check EPF statement for annual contribution' },
        { category: 'Medical Insurance', claimed_rm: 0,         max_rm: 3000, gap_rm: 3000,                       status: 'UNCLAIMED', tip: 'Get a medical card — fully claimable' },
        { category: 'Life Insurance',    claimed_rm: 0,         max_rm: 3000, gap_rm: 3000,                       status: 'UNCLAIMED', tip: 'Life/takaful policy premiums' },
      ],
      zakat_applicable:  annual > 23000,
      zakat_annual_rm:   zakatAnnual,
      zakat_monthly_rm:  Math.round(zakatAnnual / 12),
      zakat_explanation: `2.5% of annual income RM ${annual.toLocaleString()} above nisab RM 23,000 = RM ${zakatAnnual.toLocaleString()}/yr`,
      ...ai,
    }));
}

// ─── Agent 8: Financial Fraud Vulnerability Profiler ─────────────────────

async function agentFraudVulnerability(enriched) {
  const debtItems = Object.entries(enriched.debts || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => `${DEBT_NAMES[k] || k}: RM ${v}/mo`)
    .join(', ') || 'no debts';

  // Server-side: calculate payment-to-income ratios per loan
  const loanAnalysis = Object.entries(enriched.debts || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([k, v]) => {
      const monthly = Number(v);
      const pctIncome = enriched.totalMonthlyIncome > 0
        ? ((monthly / enriched.totalMonthlyIncome) * 100).toFixed(1) : 0;
      // Rough typical balances to estimate EIR
      const typicalBalance = k === 'car_loan' ? monthly * 60
        : k === 'housing_loan' ? monthly * 240
        : k === 'ptptn' ? monthly * 120
        : k === 'credit_card_min' ? monthly * 6   // min payment ≈ 16.7% of balance
        : monthly * 48;
      // Rough annual rate estimate (simplified annuity formula proxy)
      const impliedRate = k === 'credit_card_min' ? 18 : k === 'personal_loan' ? 12 : k === 'other_loan' ? 15 : null;
      return { key: k, name: DEBT_NAMES[k] || k, monthly, pctIncome, impliedRate, typicalBalance };
    });

  return callAgent(`Malaysian financial fraud protection expert. Assess fraud vulnerability.
User: Age ${enriched.age}, ${enriched.lifeStage}. Monthly income RM ${enriched.totalMonthlyIncome}. DSR ${enriched.totalMonthlyIncome > 0 ? ((enriched.totalMonthlyDebtPayments/enriched.totalMonthlyIncome)*100).toFixed(1) : 0}%.
Debts: ${debtItems}. Monthly savings: RM ${enriched.monthlySavings}. Current savings: RM ${enriched.currentSavings}.
IMPORTANT: Keep ALL string values under 15 words. All arrays max 3 items.
Assess:
1. money_mule_risk: HIGH/MEDIUM/LOW — does financial desperation make them a target for money mule recruitment ("akaun pak sedara")?
2. predatory_loan_risk: HIGH/MEDIUM/LOW — do payment amounts suggest illegal lending?
3. fraud_entry_points: top 3 ways scammers could exploit this specific profile
4. protective_actions: top 3 things to do NOW to reduce fraud vulnerability
5. Overall vulnerability_score 0-100
Return JSON only:
{"vulnerability_score":0,"overall_level":"MEDIUM","money_mule_risk":"LOW","money_mule_explanation":"Short explanation","predatory_loan_risk":"LOW","predatory_loan_explanation":"Short explanation","fraud_entry_points":["point 1","point 2","point 3"],"protective_actions":["action 1","action 2","action 3"],"high_risk_loans":[],"digital_safety_tips":["tip 1","tip 2","tip 3"],"summary":"One sentence."}`, 1500);
}

app.post('/api/fraud-profile', async (req, res) => {
  try {
    const body = req.body;
    if (!body) return res.status(400).json({ error: 'Missing data' });
    // Accept flat format from frontend (totalMonthlyIncome already computed)
    const totalExpenses = Object.values(body.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const enriched = {
      age:                      body.age || 25,
      lifeStage:                body.lifeStage || 'young_adult',
      riskAppetite:             body.riskAppetite || 'moderate',
      debts:                    {},
      expenses:                 body.expenses || {},
      totalMonthlyIncome:       Number(body.totalMonthlyIncome) || 0,
      totalMonthlyDebtPayments: Number(body.totalMonthlyDebts)  || 0,
      totalMonthlyExpenses:     totalExpenses,
      monthlySavings:           Math.max(0, (Number(body.totalMonthlyIncome) || 0) - (Number(body.totalMonthlyDebts) || 0) - totalExpenses),
      currentSavings:           Number(body.currentSavings) || 0,
    };
    const result = await agentFraudVulnerability(enriched);
    const validLevels = ['HIGH', 'MEDIUM', 'LOW'];
    if (!validLevels.includes(result.overall_level))    result.overall_level    = 'MEDIUM';
    if (!validLevels.includes(result.money_mule_risk))  result.money_mule_risk  = 'MEDIUM';
    if (!validLevels.includes(result.predatory_loan_risk)) result.predatory_loan_risk = 'LOW';
    if (!result.vulnerability_score || result.vulnerability_score > 100) result.vulnerability_score = 50;
    res.json(result);
  } catch (err) {
    console.error('[Fraud Profile Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Quick Purchase Check (standalone, no full pipeline) ─────────────────
app.post('/api/quick-purchase', async (req, res) => {
  try {
    const { profile, purchaseItem } = req.body;
    if (!profile || !purchaseItem?.item) return res.status(400).json({ error: 'Missing profile or purchaseItem' });
    const totalDebt     = Object.values(profile.debts    || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalIncome   = Object.values(profile.income   || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalExpenses = Object.values(profile.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const dsrPct = totalIncome > 0 ? +((totalDebt / totalIncome) * 100).toFixed(1) : 0;
    const dsrStatus = dsrPct < 40 ? 'SAFE' : dsrPct < 60 ? 'WARNING' : 'DANGER';
    const mockDSR  = { dsr_percentage: dsrPct, dsr_status: dsrStatus, headroom_rm: Math.max(0, totalIncome * 0.6 - totalDebt) };
    const savRate  = totalIncome > 0 ? +((Math.max(0, totalIncome - totalDebt - totalExpenses) / totalIncome) * 100).toFixed(1) : 0;
    const mockRisk = { overall_risk: dsrPct >= 60 ? 'HIGH' : dsrPct >= 40 ? 'MEDIUM' : 'LOW', savings_rate_percentage: savRate };
    const enriched = {
      totalMonthlyIncome:       totalIncome,
      totalMonthlyDebtPayments: totalDebt,
      totalMonthlyExpenses:     totalExpenses,
      monthlySavings:           Math.max(0, totalIncome - totalDebt - totalExpenses),
      currentSavings:           Number(profile.currentSavings) || 0,
      age:                      profile.age || 25,
      lifeStage:                profile.lifeStage || 'young_adult',
    };
    const result = await agentPurchaseAdvisor(enriched, mockDSR, mockRisk, purchaseItem);
    res.json(result);
  } catch (err) {
    console.error('[Quick Purchase Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Tax & Zakat Endpoint (Agent 7) ──────────────────────────────────────
app.post('/api/tax-zakat', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: 'Missing profile' });

    const totalIncome   = Object.values(profile.income   || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalDebt     = Object.values(profile.debts    || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalExpenses = Object.values(profile.expenses || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const enriched = {
      ...profile,
      totalMonthlyIncome:       totalIncome,
      totalMonthlyDebtPayments: totalDebt,
      totalMonthlyExpenses:     totalExpenses,
      monthlySavings:           Math.max(0, totalIncome - totalDebt - totalExpenses),
      currentSavings:           Number(profile.currentSavings) || 0,
    };

    const result = await agentTaxZakat(enriched);

    // Server-side sanity fixes
    if (!result.annual_income_estimate || result.annual_income_estimate < 1)
      result.annual_income_estimate = totalIncome * 12;
    if (result.zakat_applicable && result.zakat_annual_rm > 0 && !result.zakat_monthly_rm)
      result.zakat_monthly_rm = parseFloat((result.zakat_annual_rm / 12).toFixed(2));
    // Ensure relief item statuses are valid
    const validStatuses = ['MAXED', 'PARTIAL', 'UNCLAIMED', 'NOT_APPLICABLE'];
    result.relief_items = (result.relief_items || []).map(item => ({
      ...item,
      status: validStatuses.includes(item.status) ? item.status : (item.gap_rm > 0 ? 'PARTIAL' : 'MAXED'),
    }));

    res.json(result);
  } catch (err) {
    console.error('[Tax-Zakat Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Scam Check Endpoint (Agent 6) ───────────────────────────────────────
app.post('/api/scam-check', async (req, res) => {
  try {
    const { offerText, userProfile } = req.body;
    if (!offerText?.trim()) return res.status(400).json({ error: 'Offer text required' });
    const result = await agentScamDetector(offerText.trim(), userProfile || {});
    // Enforce valid verdict values
    const validVerdicts = ['LIKELY_SCAM', 'SUSPICIOUS', 'LEGITIMATE'];
    if (!validVerdicts.includes(result.verdict)) result.verdict = 'SUSPICIOUS';
    res.json(result);
  } catch (err) {
    console.error('[Scam Check Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Assistant Q&A Endpoint ───────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  try {
    const { question, analysisData, formData } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question required' });

    const dsr        = analysisData?.dsr        || {};
    const risk       = analysisData?.risk        || {};
    const shield     = analysisData?.shield      || {};
    const investment = analysisData?.investment  || {};
    const plan       = analysisData?.plan        || {};
    const purchase   = analysisData?.purchase    || {};

    const totalIncome = Object.values(formData?.income || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const totalDebts  = Object.values(formData?.debts  || {}).reduce((a, b) => a + (Number(b) || 0), 0);

    const contextParts = [
      totalIncome   > 0   && `Monthly income: RM ${totalIncome.toLocaleString()}`,
      totalDebts    > 0   && `Monthly debt payments: RM ${totalDebts.toLocaleString()}`,
      dsr.dsr_percentage  != null && `DSR: ${dsr.dsr_percentage}% (${dsr.dsr_status || 'UNKNOWN'}) — BNM safe limit is 60%`,
      dsr.headroom_rm     != null && `DSR headroom: RM ${dsr.headroom_rm} before hitting 60% limit`,
      risk.overall_risk         && `Risk level: ${risk.overall_risk} (score ${risk.risk_score || 0}/100)`,
      risk.savings_rate_percentage != null && `Savings rate: ${risk.savings_rate_percentage}% (target: 20%)`,
      risk.emergency_fund_months  != null && `Emergency fund: ${risk.emergency_fund_months} months`,
      shield.score        != null && `Shield Score: ${shield.score}/100 (${shield.level || ''})`,
      shield.breakdown?.length    && `Shield vulnerabilities: ${shield.breakdown.map(b => b.factor).join(', ')}`,
      investment.investment_readiness && `Investment readiness: ${investment.investment_readiness}`,
      investment.investable_amount_monthly > 0 && `Investable amount: RM ${investment.investable_amount_monthly}/mo`,
      investment.recommendations?.length && `Top investment: ${investment.recommendations[0]?.name || 'N/A'}`,
      plan.financial_twin?.name   && `Financial Twin archetype: ${plan.financial_twin.name}`,
      purchase.verdict            && `Purchase verdict: ${purchase.verdict} — ${purchase.item_name || ''}`,
      formData?.age               && `User age: ${formData.age}`,
      formData?.lifeStage         && `Life stage: ${formData.lifeStage}`,
      formData?.riskAppetite      && `Risk appetite: ${formData.riskAppetite}`,
    ].filter(Boolean).join('. ');

    const context = contextParts || 'No analysis data available yet — give general Malaysian personal finance advice.';

    const result = await callAgent(`You are DebtSense MY's personal AI financial advisor — an expert in Malaysian personal finance, Bank Negara Malaysia (BNM) guidelines, EPF, ASB, PTPTN, AKPK, and digital fraud protection.
The user has completed a financial analysis. Here is their data:
${context}

User's question: "${question.trim()}"

Instructions:
- Answer directly and specifically using THEIR numbers above
- Keep it under 120 words — be concise and actionable
- Use Malaysian context (RM, BNM rules, local resources like AKPK, EPF i-Saraan, ASB)
- If DSR is high, acknowledge the risk and give concrete steps
- If asking about scam risk, connect to their specific DSR/Shield Score
- Speak like a knowledgeable friend, not a robot
- End with ONE specific action they can take today
Return ONLY valid JSON: {"answer": "your answer here"}`, 800);

    res.json({ answer: result?.answer || 'I could not generate a response. Please try again.' });
  } catch (err) {
    console.error('[Ask Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'DebtSense MY' }));

const distPath = join(__dirname, '../frontend/dist');
if (existsSync(distPath)) {
  const { default: serveStatic } = await import('serve-static');
  app.use(serveStatic(distPath));
  app.get('*', (_, res) => res.sendFile(join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => console.log(`✅ DebtSense MY backend running on http://localhost:${PORT}`));
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.\n   Run this to fix it:\n   cmd /c "for /f \\"tokens=5\\" %a in ('netstat -ano ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /F /PID %a"\n   Then restart: node backend/server.js\n`);
    process.exit(1);
  } else { throw err; }
});
