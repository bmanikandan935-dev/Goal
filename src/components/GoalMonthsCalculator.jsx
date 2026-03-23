import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
} from "recharts";
import styles from "./GoalMonthsCalculator.module.css";

const calcTimeline = ({ goal, monthly, annualRate, monthlyEscalation }) => {
  const target = Number(goal);
  const deposit = Number(monthly);
  const annual = Number(annualRate) / 100;
  const escalation = Number(monthlyEscalation) / 100;

  if (!target || !deposit || target <= 0 || deposit <= 0) return [];

  const timeline = [];
  let balance = 0;
  let month = 0;
  let currentDeposit = deposit;
  let totalContributions = 0;

  while (balance < target && month < 1000) {
    month += 1;
    const interest = balance * (annual / 12);
    totalContributions += currentDeposit;
    balance += interest + currentDeposit;

    timeline.push({
      month,
      balance: Number(balance.toFixed(2)),
      monthlyDeposit: Number(currentDeposit.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      totalContributions: Number(totalContributions.toFixed(2)),
      progress: Math.min(100, (balance / target) * 100),
    });

    currentDeposit *= 1 + escalation;
  }

  return timeline;
};

const createYearlyData = (timeline) => {
  if (!timeline.length) return [];

  const yearly = [];
  for (const point of timeline) {
    if (point.month % 12 === 0 || point.month === timeline.length) {
      yearly.push({
        year: Math.ceil(point.month / 12),
        balance: point.balance,
        contributions: point.totalContributions,
      });
    }
  }
  return yearly;
};

const format = (value) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export default function GoalMonthsCalculator() {
  const [goal, setGoal] = useState(12000);
  const [monthly, setMonthly] = useState(500);
  const [annualRate, setAnnualRate] = useState(4.5);
  const [monthlyEscalation, setMonthlyEscalation] = useState(1);
  const [viewMode, setViewMode] = useState("monthly");
  const [copyStatus, setCopyStatus] = useState("");
  const [theme, setTheme] = useState("light");

  const validationErrors = useMemo(() => {
    const errors = [];
    if (!goal || goal <= 0) errors.push("Goal must be greater than 0.");
    if (!monthly || monthly <= 0) errors.push("Monthly contribution must be greater than 0.");
    if (annualRate < 0) errors.push("Annual rate cannot be negative.");
    if (monthlyEscalation < 0) errors.push("Monthly escalation cannot be negative.");
    return errors;
  }, [goal, monthly, annualRate, monthlyEscalation]);

  const timeline = useMemo(
    () => (validationErrors.length === 0 ? calcTimeline({ goal, monthly, annualRate, monthlyEscalation }) : []),
    [goal, monthly, annualRate, monthlyEscalation, validationErrors]
  );

  const yearlyData = useMemo(() => createYearlyData(timeline), [timeline]);
  const chartData = viewMode === "yearly" ? yearlyData : timeline;

  const monthsCount = timeline.length;
  const finalBalance = timeline[monthsCount - 1]?.balance || 0;
  const progress = timeline.length ? Math.min(100, (finalBalance / Number(goal || 1)) * 100) : 0;

  const shareText = timeline.length
    ? `Goal ${goal}$ in ${monthsCount} months (Expected ${format(finalBalance)}$ at ${annualRate}% annual)`
    : "Please enter valid inputs to generate a timeline.";

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyStatus("Copied!");
    } catch (error) {
      setCopyStatus("Copy failed.");
    }

    setTimeout(() => setCopyStatus(""), 1700);
  };

  return (
    <section className={`${styles.goalCalculator} ${theme === "dark" ? styles.dark : ""}`}>
      <div className={styles.goalHeader}>
        <h2>Goal Months Calculator</h2>
      </div>

      <form className={styles.goalForm} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.field}>
          <label htmlFor="goal">Goal Amount ($)</label>
          <input
            id="goal"
            type="number"
            min="0"
            step="100"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="monthly">Monthly Contribution ($)</label>
          <input
            id="monthly"
            type="number"
            min="0"
            step="10"
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="rate">Annual Interest Rate (%)</label>
          <input
            id="rate"
            type="number"
            min="0"
            step="0.1"
            value={annualRate}
            onChange={(e) => setAnnualRate(Number(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="escalation">Monthly Increase (%)</label>
          <input
            id="escalation"
            type="number"
            min="0"
            step="0.1"
            value={monthlyEscalation}
            onChange={(e) => setMonthlyEscalation(Number(e.target.value))}
          />
        </div>
      </form>

      {validationErrors.length > 0 && (
        <div className={styles.validationBox}>
          {validationErrors.map((err, index) => (
            <p key={index}>{err}</p>
          ))}
        </div>
      )}

      <section className={styles.timeline}>
        <div className={styles.controlsRow}>
          <button className={styles.shareButton} onClick={handleCopyShare} disabled={!timeline.length}>
            Copy result
          </button>
          <span className={styles.copyStatus}>{copyStatus}</span>

          <div className={styles.toggleGroup}>
            <label>
              <input
                type="radio"
                checked={viewMode === "monthly"}
                onChange={() => setViewMode("monthly")}
              />
              Monthly
            </label>
            <label>
              <input
                type="radio"
                checked={viewMode === "yearly"}
                onChange={() => setViewMode("yearly")}
              />
              Yearly
            </label>
          </div>

          <div className={styles.themeGroup}>
            <button
              className={styles.themeButton}
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              type="button"
            >
              {theme === "light" ? "Dark" : "Light"} mode
            </button>
          </div>
        </div>

        <div className={styles.resultCard}>
          <article className={styles.statusBox}>
            <strong>{monthsCount ? `${monthsCount} months` : "-"}</strong>
            <span>{monthsCount ? `to reach $${format(goal)}` : "waiting for valid input"}</span>
          </article>
          <article className={styles.statusBox}>
            <strong>${format(finalBalance)}</strong>
            <span>projected final balance</span>
          </article>
          <article className={styles.statusBox}>
            <strong>{format(progress)}%</strong>
            <span>progress vs goal</span>
          </article>
        </div>

        <div className={styles.progressBarFrame}>
          <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
        </div>

        <motion.div
          className={styles.chartWrapper}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              {viewMode === "yearly" ? (
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e8ecf8" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${format(value)}`} />
                  <Legend />
                  <Bar dataKey="balance" name="Balance" fill="#4b77f2" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="contributions" name="Total Contributions" fill="#5bc360" radius={[6, 6, 0, 0]} />
                </ComposedChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `$${format(value)}`} />
                  <Legend />
                  <Area type="monotone" dataKey="balance" stackId="1" stroke="#4b77f2" fill="#add5ff" />
                  <Line type="monotone" dataKey="totalContributions" name="Total Contributions" stroke="#5bc360" dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className={styles.chartEmpty}>Enter valid numbers to see chart</div>
          )}
        </motion.div>

        <div className={styles.monthList}>
          <AnimatePresence>
            {(viewMode === "yearly" ? yearlyData : timeline.slice(0, 24)).map((entry) => (
              <motion.div
                className={styles.monthItem}
                key={viewMode === "yearly" ? `year-${entry.year}` : entry.month}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <strong>{viewMode === "yearly" ? `Year ${entry.year}` : `Month ${entry.month}`}</strong> – ${format(entry.balance)}
                </div>
                {viewMode === "monthly" ? (
                  <div className={styles.badge}>+{format(entry.interest)} interest</div>
                ) : (
                  <div className={styles.badge}>contribution ${format(entry.contributions)}</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {viewMode === "monthly" && timeline.length > 24 && (
            <div className={styles.monthItem}>
              <em>...plus {timeline.length - 24} more months in timeline</em>
            </div>
          )}
          {viewMode === "yearly" && yearlyData.length > 10 && (
            <div className={styles.monthItem}>
              <em>...plus {yearlyData.length - 10} more years in timeline</em>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
