"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Sun, Moon } from 'lucide-react';
import './testimonial-v2.css';

// --- Types ---
export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

// --- Default Data (Themed for SIMANIKA / HIMANIKA with verified Unsplash portraits) ---
export const defaultTestimonials: Testimonial[] = [
  {
    text: "Di HIMANIKA, aku pertama kali belajar bagaimana memimpin tim teknologi dan merilis produk dari nol. Pengalaman kolaborasi lintas divisi di SIMANIKA adalah modal terbesarku di industri saat ini.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    name: "Farhan Rizky",
    role: "Alumni 2023 · Frontend Engineer di Traveloka",
  },
  {
    text: "Ruang belajar yang sangat suportif. Di sini kita tidak hanya berkutat dengan teori kuliah, melainkan terjun langsung mengelola publikasi digital, kampanye event, dan visual branding organisasi secara nyata.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    name: "Sarah Amalia",
    role: "Mahasiswa MI · Koordinator Kominfo 2025",
  },
  {
    text: "Kultur eksplorasi teknologi di divisi Ristek HIMANIKA sangat kuat. Lewat workshop internal dan mentoring senior, aku menemukan passion di infrastruktur cloud dan automasi sejak semester 3.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    name: "Budi Setiawan",
    role: "Alumni 2022 · Cloud Architect di Telkom",
  },
  {
    text: "SIMANIKA bukan sekadar sistem informasi, ini rumah kedua di mana aspirasi dihargai dan setiap mahasiswa diberi panggung untuk berani berkarya tanpa rasa takut salah.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
    name: "Nabila Ananda",
    role: "Mahasiswa MI · Staff PSDM 2025",
  },
  {
    text: "Mengelola ekosistem organisasi dan ratusan anggota memberikan pelajaran kepemimpinan, negosiasi, dan eksekusi strategis yang tidak ternilai harganya bagi perjalanan karierku.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    name: "Kevin Pratama",
    role: "Ketua Umum HIMANIKA 2024 · Associate PM",
  },
  {
    text: "Dukungan penuh dari himpunan saat persiapan competition IT tingkat nasional benar-benar luar biasa. HIMANIKA membentuk mentalitas pemenang dan solidaritas yang solid.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    name: "Jessica Tan",
    role: "Alumni 2024 · Cybersecurity Analyst",
  },
  {
    text: "Membangun modul Open Recruitment dan sistem presensi di SIMANIKA memberi pengalaman langsung menangani database berskala nyata dan integrasi REST API modern.",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    name: "Dimas Arya",
    role: "Mahasiswa MI · Backend Developer",
  },
  {
    text: "Setiap program kerja dirancang dengan perhatian mendalam pada pengalaman anggota. HIMANIKA mengajarkan arti empati, komunikasi efektif, dan eksekusi visual yang memukau.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    name: "Amanda Putri",
    role: "Koordinator Acara 2024 · UI/UX Designer",
  },
  {
    text: "Jaringan alumni dan bimbingan karir yang diinisiasi himpunan membuka jalan emas saat magang hingga diterima di tech company sebelum lulus wisuda.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    name: "Reynaldi Pratama",
    role: "Alumni 2023 · Mobile Engineer",
  },
];

// --- Sub-Components ---
export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={`testimonial-column ${props.className || ''}`}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="testimonial-marquee-list flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <motion.li 
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  whileHover={{ 
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(21, 94, 239, 0.18), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(21, 94, 239, 0.25)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  whileFocus={{ 
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(21, 94, 239, 0.18), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(21, 94, 239, 0.25)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="testimonial-card-v2 p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg shadow-black/5 max-w-xs w-full bg-white dark:bg-neutral-900 transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-primary/30" 
                >
                  <blockquote className="m-0 p-0">
                    <p className="testimonial-card-quote text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal m-0 transition-colors duration-300">
                      &ldquo;{text}&rdquo;
                    </p>
                    <footer className="testimonial-card-footer flex items-center gap-3 mt-6">
                      <img
                        width={44}
                        height={44}
                        src={image}
                        alt={`Avatar of ${name}`}
                        className="testimonial-card-avatar h-11 w-11 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-800 group-hover:ring-primary/30 transition-all duration-300 ease-in-out"
                        loading="lazy"
                      />
                      <div className="testimonial-card-author-info flex flex-col">
                        <cite className="testimonial-card-name font-semibold not-italic tracking-tight leading-5 text-neutral-900 dark:text-white transition-colors duration-300">
                          {name}
                        </cite>
                        <span className="testimonial-card-role text-sm leading-5 tracking-tight text-neutral-500 dark:text-neutral-500 mt-0.5 transition-colors duration-300">
                          {role}
                        </span>
                      </div>
                    </footer>
                  </blockquote>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  );
};

// --- Pure Testimonials Columns Component (without 21st.dev header) ---
export const TestimonialMarqueeColumns = (props: {
  testimonials?: Testimonial[];
  className?: string;
}) => {
  const items = props.testimonials
    ? props.testimonials 
    : defaultTestimonials;

  const count = items.length;
  const colSize = Math.ceil(count / 3);
  const firstColumn = items.slice(0, colSize);
  const secondColumn = items.slice(colSize, colSize * 2);
  const thirdColumn = items.slice(colSize * 2);

  return (
    <div 
      className={`testimonial-v2-scroller flex justify-center gap-6 mt-6 max-h-[640px] overflow-hidden ${props.className || ''}`}
      role="region"
      aria-label="Scrolling Testimonials"
    >
      <TestimonialsColumn testimonials={firstColumn} duration={18} className="testimonial-column--col1" />
      <TestimonialsColumn testimonials={secondColumn} className="hidden md:block testimonial-column--col2" duration={23} />
      <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block testimonial-column--col3" duration={20} />
    </div>
  );
};

// --- Full Section Component (as provided by 21st.dev template) ---
export const TestimonialsSection = () => {
  return (
    <section 
      aria-labelledby="testimonials-heading"
      className="bg-transparent py-16 relative overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1]
        }}
        className="container px-4 z-10 mx-auto"
      >
        <TestimonialMarqueeColumns />
      </motion.div>
    </section>
  );
};

// --- Main App Component ---
export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="w-screen min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-300 flex flex-col justify-center relative selection:bg-primary selection:text-white">
      {/* Dark Mode Toggle */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 shadow-xl hover:scale-110 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Toggle Dark Mode"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <TestimonialsSection />
    </div>
  );
}
