export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-camp-bg rounded-2xl flex items-center justify-center mb-4">
          <Icon size={28} className="text-camp-text-muted" />
        </div>
      )}
      <h3 className="text-camp-text-primary font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-camp-text-secondary text-sm mb-5 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  )
}
