const STATUS_STYLES = {
  safe: 'bg-green-100 text-green-700',
  caution: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
}

function StatusBadges({ badges }) {
  if (!badges) return null

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-full px-4 py-2 text-sm font-medium ${STATUS_STYLES[badge.status]}`}
        >
          {badge.icon} {badge.label}
        </span>
      ))}
    </div>
  )
}

export default StatusBadges
