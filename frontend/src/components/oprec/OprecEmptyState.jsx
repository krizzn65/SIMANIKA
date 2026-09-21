// Adapted for HIMANIKA from the Empty State composition by Serafim on 21st.dev (MIT).
// https://21st.dev/@serafimcloud/components/empty-state
export function OprecEmptyState() {
  return (
    <div
      className="oprec-preview-empty"
      role="status"
      aria-label="Open Recruitment belum dibuka"
    >
      {/* Corner crosshairs */}
      <span className="oprec-preview-empty__corner oprec-preview-empty__corner--tl" aria-hidden="true">+</span>
      <span className="oprec-preview-empty__corner oprec-preview-empty__corner--tr" aria-hidden="true">+</span>
      <span className="oprec-preview-empty__corner oprec-preview-empty__corner--bl" aria-hidden="true">+</span>
      <span className="oprec-preview-empty__corner oprec-preview-empty__corner--br" aria-hidden="true">+</span>

      <div className="oprec-preview-empty__body">
        <span className="oprec-preview-empty__eyebrow oprec-mono">
          KESEMPATAN BERIKUTNYA SEGERA HADIR
        </span>
        <p className="oprec-preview-empty__title">
          Open Recruitment<br />
          <strong>belum dibuka.</strong>
        </p>
        <span className="oprec-preview-empty__caption">
          Informasi pendaftaran akan muncul di sini saat periode baru diumumkan.
        </span>
      </div>
    </div>
  );
}
