export function ProgressBar({ stage }) {
  const percent = (stage / 5) * 100

  return (
    <div className="mb-4">
      <div className="h-2 bg-gray-200 rounded">
        <div className="h-2 bg-blue-500 rounded" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-sm mt-1">Step {stage} of 5</p>
    </div>
  )
}