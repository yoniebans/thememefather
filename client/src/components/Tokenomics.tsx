import { PieChart, Pie, ResponsiveContainer, Sector } from "recharts";
import { useState, useEffect } from "react";

const data = [
  { name: "LP partners", value: 36, fill: "#166534" },
  { name: "Partners", value: 24, fill: "#15803d" },
  { name: "Team", value: 10, fill: "#16a34a" },
  { name: "Marketing", value: 10, fill: "#22c55e" },
  { name: "ai16z Partners", value: 5, fill: "#4ade80" },
  { name: "Aethir Stakers", value: 5, fill: "#86efac" },
  { name: "Daos.fun", value: 5, fill: "#bbf7d0" },
  { name: "Public", value: 5, fill: "#dcfce7" },
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
  isMobile: boolean;
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
    isMobile,
  } = props;

  // Adjust font sizes for better readability
  const labelFontSize = isMobile ? "12px" : "16px";
  const percentFontSize = isMobile ? "11px" : "14px";
  const labelOffset = isMobile ? 15 : 30;
  const lineLength = isMobile ? 15 : 22;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const mx = cx + (outerRadius + labelOffset) * cos;
  const my = cy + (outerRadius + labelOffset) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * lineLength;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + (isMobile ? 3 : 6)}
        outerRadius={outerRadius + (isMobile ? 5 : 10)}
        fill={payload.fill}
      />
      <path
        d={`M${cx + outerRadius * cos},${cy + outerRadius * sin}L${mx},${my}L${ex},${ey}`}
        stroke={payload.fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={payload.fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#555"
        style={{ fontSize: labelFontSize, fontWeight: 500 }}
      >
        {payload.name}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
        style={{ fontSize: percentFontSize }}
      >
        {`${percent * 100}%`}
      </text>
    </g>
  );
};

export const TokenomicsChart = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-[500px] md:h-[600px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={isMobile ? 70 : 120}
            outerRadius={isMobile ? 90 : 160}
            dataKey="value"
            label={(props) => renderLabel({ ...props, isMobile })}
            labelLine={false}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
