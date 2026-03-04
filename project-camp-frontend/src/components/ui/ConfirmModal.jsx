import Modal from './Modal'
import Spinner from './Spinner'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-camp-text-secondary text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="bg-red-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Spinner size="sm" />}
          Delete
        </button>
      </div>
    </Modal>
  )
}
