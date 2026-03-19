import TopBar from './TopBar'

/**
 * Single row for all app pages: title (left), optional center (e.g. Ready to Assign on Plan), TopBar (right).
 * Uses a fixed 3-column grid so the menu (TopBar) stays in the same position on every page.
 */
export default function PageHeaderRow({ left, center }) {
  return (
    <div className={`page-header-row ${center != null ? 'page-header-row-with-center' : ''}`}>
      <div className="page-header-left">{left}</div>
      <div className="page-header-center">{center}</div>
      <div className="page-header-right">
        <TopBar />
      </div>
    </div>
  )
}
