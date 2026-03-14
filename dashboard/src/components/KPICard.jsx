export default function KPICard({ label, value, color, target, actual }) {
  const isPercentage = typeof target === 'number';
  const status = isPercentage
    ? actual >= target
      ? 'above'
      : actual >= target * 0.85
        ? 'near'
        : 'below'
    : null;

  const statusColors = {
    above: '#2ecc71',
    near: '#f39c12',
    below: '#ff5a5f',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col justify-between border-t-4 hover:shadow-md transition-shadow"
      style={{ borderTopColor: isPercentage ? statusColors[status] : color }}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: isPercentage ? statusColors[status] : color }}>
        {value}
      </p>
      {isPercentage && (
        <div className="mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(actual, 100)}%`,
                backgroundColor: statusColors[status],
              }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Target: {target}%</p>
        </div>
      )}
    </div>
  );
}
