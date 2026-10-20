export function OprecSkeleton() {
  return (
    <div className="oprec-container oprec-loading" role="status" aria-busy="true" aria-label="Memuat informasi OPREC">
      <div aria-hidden="true">
        <span className="skeleton skeleton--line" style={{ width: "14rem" }} />
        <div className="oprec-skeleton__hero">
          <div>
            <span className="skeleton oprec-skeleton__headline" />
            <span className="skeleton oprec-skeleton__headline" style={{ width: "70%" }} />
          </div>
          <div>
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line" style={{ width: "60%" }} />
            <span className="skeleton skeleton--button" />
          </div>
        </div>
        <div className="oprec-division-grid">
          {[0, 1, 2, 3, 4, 5].map((item) => <span key={item} className="skeleton oprec-skeleton__division" />)}
        </div>
      </div>
    </div>
  );
}
