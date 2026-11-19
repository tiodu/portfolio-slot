export function CabinetStill({ scriptClassName }: { scriptClassName?: string }) {
  return (
    <div className="still" aria-hidden="true">
      <div className="still-machine">
        <div className="still-arch">
          <span className={scriptClassName}>Eduardo</span>
        </div>
        <div className="still-body">
          <div className="still-window">
            <span />
            <span />
            <span />
          </div>
          <div className="still-drawer" />
        </div>
        <div className="still-lever">
          <span />
        </div>
      </div>
    </div>
  );
}
