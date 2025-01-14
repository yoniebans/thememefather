import { PieChart, Pie, ResponsiveContainer, Sector } from "recharts";

const data = [
  { name: "LP partners", value: 36, fill: "#166534" }, // green-800
  { name: "Partners", value: 24, fill: "#15803d" }, // green-700
  { name: "Team", value: 10, fill: "#16a34a" }, // green-600
  { name: "Marketing", value: 10, fill: "#22c55e" }, // green-500
  { name: "ai16z Partners", value: 5, fill: "#4ade80" }, // green-400
  { name: "Aethir Stakers", value: 5, fill: "#86efac" }, // green-300
  { name: "Daos.fun", value: 5, fill: "#bbf7d0" }, // green-200
  { name: "Public", value: 5, fill: "#dcfce7" }, // green-100
];

interface RenderLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name: string;
    value: number;
    fill: string;
  };
  percent: number;
}

const renderLabel = (props: RenderLabelProps) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    outerRadius,
    startAngle,
    endAngle,
    payload,
    percent,
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={payload.fill}
      />
      <path
        d={`M${cx + outerRadius * cos},${
          cy + outerRadius * sin
        }L${mx},${my}L${ex},${ey}`}
        stroke={payload.fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={payload.fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
      >
        {payload.name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`${percent * 100}%`}
      </text>
    </g>
  );
};

export const TokenomicsChart = () => {
  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={120}
            outerRadius={160}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
