export default function Modal({ children }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-body">{children}</div>
    </div>
  )
}
