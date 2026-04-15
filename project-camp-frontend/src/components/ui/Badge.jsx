const variants = {
  // status
  to_do: 'bg-gray-100 text-gray-600',
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completion_requested: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
  // roles
  admin: 'bg-camp-green/10 text-camp-green',
  project_admin: 'bg-purple-100 text-purple-700',
  user: 'bg-gray-100 text-gray-600',
  member: 'bg-gray-100 text-gray-600',
  // priority
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
  // legacy / misc
  essential: 'bg-green-100 text-green-700',
  blocking: 'bg-emerald-100 text-emerald-700',
}

export default function Badge({ label, variant }) {
  const cls = variants[variant?.toLowerCase()] || variants.member
  const displayLabel = (label || variant || '').replace(/_/g, ' ')
  return (
    <span className={`${cls} text-xs px-2.5 py-1 rounded-lg font-medium capitalize`}>
      {displayLabel}
    </span>
  )
}