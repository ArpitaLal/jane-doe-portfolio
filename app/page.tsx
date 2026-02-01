"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Award,
  Code2,
  Database,
  Brain,
  Wrench,
  Terminal,
  Zap,
  Menu,
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from "lucide-react";

// Hook for scroll-triggered animations
function useInView(threshold = 0.1): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isInView];
}

// Hook for counting animation
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return count;
}

// Scroll Progress Bar
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(scrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
      <div
        className="h-full bg-gradient-to-r from-neon-pink via-neon-blue to-neon-green transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Auto-scroll Controller
function AutoScrollController() {
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const currentIndexRef = useRef(0);
  const cycleCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrollRef = useRef(true);
  const scrollIntervalsRef = useRef<Record<string, number>>({});

  // Section configuration
  const sectionsRef = useRef([
    { id: "about", label: "About", parent: "about" },
    { id: "education", label: "Education", parent: "education" },
    { id: "skills", label: "Skills", parent: "skills" },
    { id: "project-1", label: "Project 1", parent: "projects" },
    { id: "project-2", label: "Project 2", parent: "projects" },
    { id: "experience", label: "Experience", parent: "experience" },
    { id: "achievements", label: "Achievements", parent: "achievements" },
    { id: "contact", label: "Contact", parent: "contact" },
  ]);

  // Calculate scroll intervals based on content height
  const calculateScrollIntervals = useCallback(() => {
    const intervals: Record<string, number> = {};
    let totalHeight = 0;

    // Measure all sections - only use sections from sectionsRef
    const sections = sectionsRef.current;
    const uniqueSectionIds = new Set<string>();
    
    sections.forEach((section) => {
      if (!uniqueSectionIds.has(section.id)) {
        uniqueSectionIds.add(section.id);
        const element = document.getElementById(section.id);
        if (element) {
          const height = element.scrollHeight;
          intervals[section.id] = height;
          totalHeight += height;
        }
      }
    });

    // Calculate time for each section proportional to its height
    // Target: ~42 seconds total (7 cycles of 6s scan-line), staying longer on bigger sections
    const TOTAL_TIME = 42000; // 42 seconds for complete cycle
    const BASE_TIME = 3000; // Minimum time per section

    sections.forEach((section) => {
      if (intervals[section.id]) {
        // Calculate proportional time: base time + proportional bonus
        const proportionalTime = (intervals[section.id] / totalHeight) * (TOTAL_TIME - BASE_TIME * sections.length);
        intervals[section.id] = BASE_TIME + proportionalTime;
      } else {
        intervals[section.id] = BASE_TIME;
      }
    });

    scrollIntervalsRef.current = intervals;
    return intervals;
  }, []);

  // Initialize intervals on mount
  useEffect(() => {
    // Wait longer for DOM to be fully ready
    setTimeout(() => {
      calculateScrollIntervals();
    }, 1000);
  }, [calculateScrollIntervals]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Set flag to tell navs that auto-scroll is active
      (window as any).isAutoScrolling = true;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      
      // Find the parent section for nav purposes
      const section = sectionsRef.current.find(s => s.id === sectionId);
      const navSection = section?.parent || sectionId;
      
      // Dispatch a custom event to update navigation to parent section
      window.dispatchEvent(new CustomEvent('sectionChanged', { detail: { sectionId: navSection } }));
      
      // Get the time this section will be displayed
      const sectionTime = scrollIntervalsRef.current[sectionId] || 4500;
      
      // Clear the flag only after the full section time
      setTimeout(() => {
        (window as any).isAutoScrolling = false;
      }, sectionTime);
      
      return true;
    }
    return false;
  }, []);

  const scheduleNextScroll = useCallback(() => {
    if (!isAutoScrollRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const sections = sectionsRef.current;
    const currentSectionId = sections[currentIndexRef.current].id;
    const interval = scrollIntervalsRef.current[currentSectionId] || 4500;

    timerRef.current = setTimeout(() => {
      if (!isAutoScrollRef.current) return;

      currentIndexRef.current += 1;

      if (currentIndexRef.current < sections.length) {
        scrollToSection(sections[currentIndexRef.current].id);
        scheduleNextScroll(); // Schedule the next one
      } else {
        // Reached the end of one cycle
        cycleCountRef.current += 1;

        if (cycleCountRef.current < 5) {
          // Continue with next cycle - reset to beginning
          currentIndexRef.current = 0;
          scrollToSection(sections[0].id);
          scheduleNextScroll();
        } else {
          // 5 cycles complete - stop on about
          currentIndexRef.current = 0;
          scrollToSection(sections[0].id);
          isAutoScrollRef.current = false;
          setIsAutoScrollActive(false);
        }
      }
    }, interval);
  }, [scrollToSection]);

  const startAutoScroll = useCallback(() => {
    isAutoScrollRef.current = true;
    setIsAutoScrollActive(true);
    currentIndexRef.current = 0;
    cycleCountRef.current = 0;
    scrollToSection(sectionsRef.current[0].id);
    scheduleNextScroll();
  }, [scrollToSection, scheduleNextScroll]);

  const pauseAutoScroll = useCallback(() => {
    isAutoScrollRef.current = false;
    setIsAutoScrollActive(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  const skipToNext = useCallback(() => {
    pauseAutoScroll();
    currentIndexRef.current += 1;
    const sections = sectionsRef.current;
    
    if (currentIndexRef.current < sections.length) {
      scrollToSection(sections[currentIndexRef.current].id);
    }
  }, [pauseAutoScroll, scrollToSection]);

  const skipToPrevious = useCallback(() => {
    pauseAutoScroll();
    currentIndexRef.current -= 1;
    const sections = sectionsRef.current;
    
    if (currentIndexRef.current >= 0) {
      scrollToSection(sections[currentIndexRef.current].id);
    } else {
      currentIndexRef.current = 0;
    }
  }, [pauseAutoScroll, scrollToSection]);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Start auto-scroll on mount
  useEffect(() => {
    startAutoScroll();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [startAutoScroll]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-40 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-card/90 backdrop-blur-xl border border-border/50 shadow-lg">
        <button
          type="button"
          onClick={skipToPrevious}
          className="p-2 hover:bg-secondary rounded-full transition-colors text-neon-blue"
          aria-label="Skip to previous section"
          title="Previous"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        {isAutoScrollActive ? (
          <button
            type="button"
            onClick={pauseAutoScroll}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-neon-pink"
            aria-label="Pause auto-scroll"
            title="Pause"
          >
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startAutoScroll}
            className="p-2 hover:bg-secondary rounded-full transition-colors text-neon-green"
            aria-label="Resume auto-scroll"
            title="Resume"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={skipToNext}
          className="p-2 hover:bg-secondary rounded-full transition-colors text-neon-blue"
          aria-label="Skip to next section"
          title="Next"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Floating Navigation (appears after hero)
function FloatingNav() {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    const handleScroll = () => {
      // Skip scroll detection if auto-scroll is active
      if ((window as any).isAutoScrolling) return;

      const sections = [
        "about",
        "education",
        "skills",
        "projects",
        "experience",
        "achievements",
        "contact",
      ];

      // Find which section's TOP is closest to the middle of the screen
      let closestSection = "about";
      let closestDistance = Infinity;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider a section active if its top is above middle of screen AND bottom is below middle
          const middle = window.innerHeight / 2;
          if (rect.top <= middle && rect.bottom >= middle) {
            setActiveSection(section);
            return;
          }
          // If not visible, track the closest one
          const distance = Math.abs(rect.top - middle);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSection = section;
          }
        }
      }
      
      setActiveSection(closestSection);
    };

    // Listen for custom section change events from auto-scroll
    const handleSectionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveSection(customEvent.detail.sectionId);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("sectionChanged", handleSectionChange);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("sectionChanged", handleSectionChange);
    };
  }, []);

  const navItems = [
    { id: "about", label: "About" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "experience", label: "Experience" },
    { id: "achievements", label: "Achievements" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full bg-card/80 backdrop-blur-xl border border-border/50">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
              activeSection === item.id
                ? "text-neon-pink"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeSection === item.id && (
              <span className="absolute inset-0 rounded-full bg-neon-pink/10 animate-fade-in" />
            )}
            <span className="relative">{item.label}</span>
          </a>
        ))}
      </div>

      {/* Mobile nav toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 text-foreground"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      {isOpen && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 md:hidden w-48 py-2 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 animate-scale-in">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "text-neon-pink bg-neon-pink/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

// Sidebar Navigation for Desktop
function SidebarNav() {
  const [activeSection, setActiveSection] = useState("about");

  useEffect(() => {
    const handleScroll = () => {
      // Skip scroll detection if auto-scroll is active
      if ((window as any).isAutoScrolling) return;

      const sections = [
        "about",
        "education",
        "skills",
        "projects",
        "experience",
        "achievements",
        "contact",
      ];

      // Find which section's TOP is closest to the middle of the screen
      let closestSection = "about";
      let closestDistance = Infinity;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider a section active if its top is above middle of screen AND bottom is below middle
          const middle = window.innerHeight / 2;
          if (rect.top <= middle && rect.bottom >= middle) {
            setActiveSection(section);
            return;
          }
          // If not visible, track the closest one
          const distance = Math.abs(rect.top - middle);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSection = section;
          }
        }
      }
      
      setActiveSection(closestSection);
    };

    // Listen for custom section change events from auto-scroll
    const handleSectionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveSection(customEvent.detail.sectionId);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("sectionChanged", handleSectionChange);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("sectionChanged", handleSectionChange);
    };
  }, []);

  const navItems = [
    { id: "about", label: "ABOUT" },
    { id: "education", label: "EDUCATION" },
    { id: "skills", label: "SKILLS" },
    { id: "projects", label: "PROJECTS" },
    { id: "experience", label: "EXPERIENCE" },
    { id: "achievements", label: "ACHIEVEMENTS" },
    { id: "contact", label: "CONTACT" },
  ];

  return (
    <nav className="hidden lg:flex flex-col gap-3 mt-12">
      {navItems.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={`group flex items-center gap-4 text-xs font-medium tracking-widest transition-all duration-300 ${
            activeSection === item.id
              ? "text-neon-pink"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span
            className={`h-px transition-all duration-500 ${
              activeSection === item.id
                ? "w-16 bg-gradient-to-r from-neon-pink to-neon-blue"
                : "w-8 bg-muted-foreground group-hover:w-16 group-hover:bg-foreground"
            }`}
          />
          {item.label}
        </a>
      ))}
    </nav>
  );
}

// Typewriter Effect
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 1000);
        }
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span>
      {displayText}
      {showCursor && <span className="animate-pulse text-neon-pink">|</span>}
    </span>
  );
}

// Hero Section
function Hero() {
  const [ref, isInView] = useInView(0.1);

  return (
    <header
      ref={ref}
      className="lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:w-1/2 lg:flex-col lg:justify-between lg:py-24"
    >
      <div
        className={`transition-all duration-1000 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Terminal-style intro */}
        <div className="flex items-center gap-2 text-neon-green text-sm font-mono mb-4">
          <Terminal className="w-4 h-4" />
          <span className="opacity-70">~/portfolio</span>
          <span className="animate-pulse">_</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-highlight text-glow-pink">
            <TypewriterText text="Jane Doe" />
          </span>
        </h1>

        <h2 className="mt-3 text-lg font-medium sm:text-xl">
          <span className="text-neon-blue">Computer Science</span>{" "}
          <span className="text-muted-foreground">Undergraduate</span>
        </h2>

        <p className="mt-4 max-w-xs leading-relaxed text-muted-foreground">
          Focused on{" "}
          <span className="text-neon-green font-medium">machine learning</span>{" "}
          and{" "}
          <span className="text-neon-pink font-medium">data-driven systems</span>.
          Building clear, explainable, and well-structured solutions.
        </p>

        <SidebarNav />
      </div>

      {/* Social links */}
      <ul
        className={`mt-8 flex items-center gap-5 transition-all duration-1000 delay-500 ${
          isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {[
          { icon: Github, href: "https://github.com", label: "GitHub", color: "hover:text-neon-pink hover:glow-pink" },
          { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn", color: "hover:text-neon-blue hover:glow-blue" },
          { icon: Mail, href: "mailto:email@example.com", label: "Email", color: "hover:text-neon-green hover:glow-green" },
        ].map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`block text-muted-foreground transition-all duration-300 ${link.color}`}
              aria-label={link.label}
            >
              <link.icon className="h-6 w-6" />
            </a>
          </li>
        ))}
      </ul>
    </header>
  );
}

// Section Header with animation
function SectionHeader({
  icon: Icon,
  title,
  color = "neon-pink",
  isHovered = false,
}: {
  icon: React.ElementType;
  title: string;
  color?: string;
  isHovered?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    "neon-pink": "text-neon-pink",
    "neon-blue": "text-neon-blue",
    "neon-green": "text-neon-green",
  };

  return (
    <div 
      className="sticky top-0 z-20 -mx-6 mb-4 w-screen bg-background/80 backdrop-blur-lg px-6 py-5 border-b border-border/30 cursor-pointer transition-opacity duration-300"
      style={{opacity: isHovered ? 1 : 0}}
    >
      <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${colorClasses[color]}`}>
        <Icon className="h-4 w-4" />
        {title}
      </h2>
    </div>
  );
}

// Education Section
function Education() {
  const [ref, isInView] = useInView(0.2);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <section
      id="education"
      ref={ref}
      className="mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader icon={GraduationCap} title="Education" color="neon-blue" isHovered={isHovered} />

      <div
        className={`group relative rounded-xl p-6 border border-transparent transition-all duration-500 hover:border-neon-blue/30 hover:bg-secondary/30 card-lift ${
          isInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <h3 className="font-semibold leading-snug text-highlight group-hover:text-neon-blue transition-colors">
          Bachelor of Technology in Computer Science and Engineering
        </h3>
        <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-neon-blue" />
          <a 
            href="https://www.ucla.edu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-neon-blue transition-colors"
          >
            University of California, Los Angeles (UCLA)
          </a>
        </p>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Relevant Coursework
          </h4>
          <ul className="flex flex-wrap gap-2">
            {[
              "Data Structures and Algorithms",
              "Machine Learning",
              "Database Management Systems",
              "Operating Systems",
              "Computer Networks",
            ].map((course, index) => (
              <li
                key={course}
                className="rounded-full bg-neon-blue/10 border border-neon-blue/20 px-3 py-1 text-xs font-medium text-neon-blue transition-all duration-300 hover:bg-neon-blue/20 hover:scale-105"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {course}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Skill Bar Component
function SkillBar({ skill, level, color, delay }: { skill: string; level: number; color: string; delay: number }) {
  const [ref, isInView] = useInView(0.3);

  const colorMap: Record<string, string> = {
    pink: "bg-neon-pink",
    blue: "bg-neon-blue",
    green: "bg-neon-green",
  };

  return (
    <div ref={ref} className="mb-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-foreground">{skill}</span>
        <span className="text-muted-foreground">{level}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[color]} transition-all duration-1000 ease-out`}
          style={{
            width: isInView ? `${level}%` : "0%",
          }}
        />
      </div>
    </div>
  );
}

// Skills Section
function Skills() {
  const [ref, isInView] = useInView(0.1);
  const [isHovered, setIsHovered] = React.useState(false);

  const skillCategories = [
    {
      title: "Languages",
      icon: Code2,
      color: "neon-pink",
      skills: [
        { name: "Python", level: 85 },
        { name: "JavaScript", level: 70 },
        { name: "Java", level: 60 },
      ],
    },
    {
      title: "Machine Learning & Data",
      icon: Brain,
      color: "neon-blue",
      skills: [
        { name: "Supervised Learning", level: 80 },
        { name: "Feature Engineering", level: 75 },
        { name: "Model Evaluation", level: 70 },
      ],
    },
    {
      title: "Data Analysis & OCR",
      icon: Database,
      color: "neon-green",
      skills: [
        { name: "Pandas / NumPy", level: 85 },
        { name: "EasyOCR", level: 75 },
        { name: "PyMuPDF", level: 70 },
      ],
    },
    {
      title: "Tools & Platforms",
      icon: Wrench,
      color: "neon-pink",
      skills: [
        { name: "GitHub", level: 80 },
        { name: "VS Code", level: 90 },
        { name: "Power BI", level: 65 },
      ],
    },
  ];

  const colorStyles: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    "neon-pink": {
      border: "border-neon-pink/20 hover:border-neon-pink/50",
      bg: "bg-neon-pink/10",
      text: "text-neon-pink",
      icon: "text-neon-pink",
    },
    "neon-blue": {
      border: "border-neon-blue/20 hover:border-neon-blue/50",
      bg: "bg-neon-blue/10",
      text: "text-neon-blue",
      icon: "text-neon-blue",
    },
    "neon-green": {
      border: "border-neon-green/20 hover:border-neon-green/50",
      bg: "bg-neon-green/10",
      text: "text-neon-green",
      icon: "text-neon-green",
    },
  };

  return (
    <section
      id="skills"
      ref={ref}
      className="mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader icon={Zap} title="Skills" color="neon-green" isHovered={isHovered} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {skillCategories.map((category, categoryIndex) => {
          const styles = colorStyles[category.color];
          return (
            <div
              key={category.title}
              className={`group rounded-lg border ${styles.border} bg-card/50 p-3 transition-all duration-500 card-lift ${
                isInView ? "animate-scale-in" : "opacity-0"
              }`}
              style={{ animationDelay: `${categoryIndex * 150}ms` }}
            >
              <div className="flex items-start gap-2 mb-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md flex-shrink-0 ${styles.bg}`}>
                  <category.icon className={`h-3.5 w-3.5 ${styles.icon}`} />
                </div>
                <h3 className={`font-semibold text-xs leading-snug break-words ${styles.text}`}>{category.title}</h3>
              </div>

              <div className="space-y-2">
                {category.skills.map((skill, skillIndex) => (
                  <SkillBar
                    key={skill.name}
                    skill={skill.name}
                    level={skill.level}
                    color={category.color.replace("neon-", "")}
                    delay={categoryIndex * 150 + skillIndex * 100}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Project Card with 3D tilt effect
function ProjectCard({
  project,
  index,
  isInView,
}: {
  project: {
    title: string;
    description: string;
    contributions: string[];
    technologies: string[];
    color: string;
  };
  index: number;
  isInView: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform("");
  }, []);

  const colorStyles: Record<string, { border: string; gradient: string; tag: string }> = {
    pink: {
      border: "hover:border-neon-pink/50",
      gradient: "from-neon-pink/10 to-transparent",
      tag: "bg-neon-pink/10 text-neon-pink border-neon-pink/20",
    },
    blue: {
      border: "hover:border-neon-blue/50",
      gradient: "from-neon-blue/10 to-transparent",
      tag: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
    },
    green: {
      border: "hover:border-neon-green/50",
      gradient: "from-neon-green/10 to-transparent",
      tag: "bg-neon-green/10 text-neon-green border-neon-green/20",
    },
  };

  const styles = colorStyles[project.color];

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-xl p-6 border border-border/50 ${styles.border} bg-card/30 transition-all duration-300 ${
        isInView ? "animate-slide-up" : "opacity-0"
      }`}
      style={{
        transform,
        animationDelay: `${index * 200}ms`,
        transition: transform ? "none" : "transform 0.5s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative">
        <h3 className="font-semibold leading-snug text-highlight group-hover:text-neon-pink transition-colors">
          <a href="#" className="inline-flex items-baseline hover-underline">
            {project.title}
            <ChevronRight className="ml-1 inline-block h-4 w-4 shrink-0 transition-transform group-hover:translate-x-2" />
          </a>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-2">
            Key Contributions
          </h4>
          <ul className="space-y-1">
            {project.contributions.map((contribution, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-pink" />
                {contribution}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <li
              key={tech}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${styles.tag} transition-all hover:scale-105`}
            >
              {tech}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Projects Section
function Projects() {
  const [ref, isInView] = useInView(0.1);
  const [isHovered, setIsHovered] = React.useState(false);

  const projects = [
    {
      title: "OCR-Based Price Anomaly Detection",
      description:
        "Designed and implemented an OCR-based pipeline to extract structured tabular data from scanned PDF documents and identify potential pricing anomalies through comparison with online benchmarks.",
      contributions: [
        "Processed noisy, real-world scanned PDF inputs",
        "Focused on clarity and structure in extracted tabular data",
        "Enabled reliable price comparison for anomaly detection",
      ],
      technologies: ["Python", "EasyOCR", "PyMuPDF", "Pandas"],
      color: "pink",
    },
    {
      title: "Personality Trait Analysis Using Voice and Facial Features",
      description:
        "Explored machine learning techniques to analyze personality-related traits from voice patterns and facial features, with emphasis on ethical interpretation and explainability.",
      contributions: [
        "Worked with voice signals and facial feature data",
        "Performed feature extraction and preprocessing on multimodal inputs",
        "Focused on interpretability and responsible use of ML predictions",
      ],
      technologies: ["Python", "OpenCV", "MediaPipe", "Librosa", "Scikit-learn"],
      color: "blue",
    },
  ];

  return (
    <section
      id="projects"
      ref={ref}
      className="mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader icon={Code2} title="Projects" color="neon-pink" isHovered={isHovered} />

      <div className="space-y-8">
        {projects.map((project, index) => (
          <div key={project.title} id={`project-${index + 1}`}>
            <ProjectCard
              project={project}
              index={index}
              isInView={isInView}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// Experience Section
function Experience() {
  const [ref, isInView] = useInView(0.2);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <section
      id="experience"
      ref={ref}
      className="mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader icon={Briefcase} title="Experience" color="neon-blue" isHovered={isHovered} />

      <div
        className={`group relative rounded-xl p-6 border border-border/50 hover:border-neon-green/50 bg-card/30 transition-all duration-500 card-lift ${
          isInView ? "animate-slide-up" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative">
          <h3 className="font-semibold leading-snug">
            <span className="text-neon-green">
              Software / Data / Machine Learning Intern
            </span>
            <span className="text-muted-foreground"> at </span>
            <a 
              href="https://www.jpmorganchase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-highlight hover:text-neon-green transition-colors cursor-pointer"
            >
              JPMorgan Chase & Co.
              <ExternalLink className="ml-2 inline-block h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-neon-green" />
            </a>
          </h3>

          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground mb-3">
              Responsibilities
            </h4>
            <ul className="space-y-2">
              {[
                "Contributed to data extraction, processing, and analysis workflows",
                "Assisted in automation and data-driven problem solving",
                "Collaborated with team members to improve system reliability",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-green" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// Stats Counter
function StatsCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const [ref, isInView] = useInView(0.5);
  const count = useCountUp(value, 1500, isInView);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-neon-pink">
        {count}
        {suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// Achievements Section
function Achievements() {
  const [ref, isInView] = useInView(0.1);
  const [isHovered, setIsHovered] = React.useState(false);

  const achievements = [
    "Completed coursework and certifications related to Machine Learning and Data Science",
    "Built multiple academic and self-driven technical projects",
    "Demonstrated strong analytical and problem-solving skills",
  ];

  return (
    <section
      id="achievements"
      ref={ref}
      className="mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader icon={Award} title="Achievements" color="neon-pink" isHovered={isHovered} />

      {/* Stats */}
      <div
        className={`grid grid-cols-3 gap-4 mb-8 p-6 rounded-xl bg-card/30 border border-border/50 ${
          isInView ? "animate-fade-in" : "opacity-0"
        }`}
      >
        <StatsCounter value={5} label="Projects" suffix="+" />
        <StatsCounter value={3} label="Certifications" suffix="+" />
        <StatsCounter value={1000} label="Lines of Code" suffix="+" />
      </div>

      <div className="space-y-6">
        <div
          className={`group rounded-xl p-6 border border-border/50 hover:border-neon-pink/50 bg-card/30 transition-all duration-500 card-lift ${
            isInView ? "animate-slide-up" : "opacity-0"
          }`}
          style={{ animationDelay: "200ms" }}
        >
          <h3 className="font-semibold text-neon-pink mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Achievements & Certifications
          </h3>
          <ul className="space-y-3">
            {achievements.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors"
              >
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-neon-pink/10 text-neon-pink text-xs">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// Contact Section
function Contact() {
  const [ref, isInView] = useInView(0.2);
  const [isHovered, setIsHovered] = React.useState(false);

  const contactLinks = [
    {
      icon: Mail,
      label: "Send Email",
      href: "mailto:email@example.com",
      color: "neon-pink",
      primary: true,
    },
    {
      icon: Github,
      label: "GitHub",
      href: "https://github.com",
      color: "neon-blue",
      primary: false,
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://linkedin.com",
      color: "neon-green",
      primary: false,
    },
  ];

  return (
    <section
      id="contact"
      ref={ref}
      className="mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SectionHeader icon={Mail} title="Contact" color="neon-pink" isHovered={isHovered} />
      <div
        className={`rounded-xl border border-border/50 bg-gradient-to-br from-card/50 to-card/30 p-8 relative overflow-hidden ${
          isInView ? "animate-scale-in" : "opacity-0"
        }`}
      >
        {/* Decorative grid */}
        <div className="absolute inset-0 cyber-grid opacity-30" />

        <div className="relative">
          <h2 className="text-2xl font-bold text-highlight mb-2">
            {"Let's "}
            <span className="text-neon-pink text-glow-pink">Connect</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {"I'm always open to discussing new opportunities, collaborations, or just having a chat about machine learning and technology."}
          </p>

          <div className="flex flex-wrap gap-4">
            {contactLinks.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-all duration-300 hover:scale-105 ${
                  link.primary
                    ? "bg-neon-pink text-primary-foreground hover:shadow-lg hover:shadow-neon-pink/30"
                    : "border border-border bg-secondary text-secondary-foreground hover:border-neon-blue/50"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="pb-16 text-sm text-muted-foreground">
      <p>
        Built with{" "}
        <a
          href="https://nextjs.org"
          className="font-medium text-foreground hover:text-neon-pink hover-underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Next.js
        </a>{" "}
        and{" "}
        <a
          href="https://tailwindcss.com"
          className="font-medium text-foreground hover:text-neon-blue hover-underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tailwind CSS
        </a>
        . Deployed on{" "}
        <a
          href="https://vercel.com"
          className="font-medium text-foreground hover:text-neon-green hover-underline transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vercel
        </a>
        .
      </p>
    </footer>
  );
}

// About Section Content
function AboutContent() {
  const [ref, isInView] = useInView(0.2);

  return (
    <section
      className={`mb-16 scroll-mt-16 lg:mb-24 lg:scroll-mt-24 ${
        isInView ? "animate-fade-in" : "opacity-0"
      }`}
      ref={ref}
    >
      <p className="text-muted-foreground leading-relaxed">
        {"I'm a Computer Science undergraduate with a strong interest in "}
        <span className="font-medium text-neon-pink">machine learning</span>
        {" and "}
        <span className="font-medium text-neon-blue">data-driven systems</span>
        {". My focus is on building clear, explainable, and well-structured solutions through hands-on projects."}
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        {"I enjoy working on problems that involve "}
        <span className="text-neon-green">data extraction</span>
        {", "}
        <span className="text-neon-green">pattern recognition</span>
        {", and building systems that can learn from data. Whether it's processing noisy real-world inputs or exploring multimodal machine learning approaches, I'm driven by the challenge of creating practical, interpretable solutions."}
      </p>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        {"Currently, I'm seeking opportunities to apply my skills in machine learning, data analysis, and software development to real-world problems while continuing to learn and grow as a developer."}
      </p>
    </section>
  );
}

// Main Page
export default function Home() {
  return (
    <>
      <FloatingNav />
      <AutoScrollController />

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none z-50 scan-line opacity-50" />

      <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-12 md:px-12 md:py-20 lg:px-24 lg:py-0 relative">
        {/* Background grid */}
        <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

        <div className="lg:flex lg:justify-between lg:gap-4 relative">
          <Hero />
          <main id="about" className="pt-24 lg:w-1/2 lg:py-24">
            <AboutContent />
            <Education />
            <Skills />
            <Projects />
            <Experience />
            <Achievements />
            <Contact />
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}
