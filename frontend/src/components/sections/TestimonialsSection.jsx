import { TestimonialMarqueeColumns } from "@/components/ui/testimonial-v2";
import { PixelCorner } from "@/components/ui/PixelCorner";
import AnimatedContent from "@/components/ui/AnimatedContent";

export function TestimonialsSection({ testimonials }) {
  return (
    <section
      className="testimonials-section"
      id="testimoni"
      aria-labelledby="testimonials-title"
    >
      <div className="testimonials-shell">
        {/* Frame biru di sudut kanan dan kiri */}
        <PixelCorner position="top-left" />
        <PixelCorner position="top-right" />
        <PixelCorner position="bottom-left" />
        <PixelCorner position="bottom-right" />

        <AnimatedContent blur={6} as="header" className="testimonials-header">
          <p className="testimonials-eyebrow">
            <span aria-hidden="true" />
            05 / TESTIMONI
          </p>
          <h2 className="testimonials-title" id="testimonials-title">
            Apa kata mereka?
          </h2>
        </AnimatedContent>

        {/* 21st.dev Testimonial V2 Scrolling Columns */}
        {testimonials?.length === 0 ? <p>Testimoni sedang disiapkan.</p> : <TestimonialMarqueeColumns testimonials={testimonials} />}
      </div>
    </section>
  );
}
