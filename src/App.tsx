import { useForm } from '@formspree/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ClipboardEvent, CSSProperties } from 'react'
import { Canvas} from '@react-three/fiber'
import { Model } from './components/Dollar'
import { SquareParticles } from './components/SquareParticles'
import { TeamDeck } from './components/TeamDeck'
import { EffectComposer } from '@react-three/postprocessing'
import { DitherEffect } from './effects/DitherEffect'
import { degToRad } from 'three/src/math/MathUtils.js'
import './App.css'

export default function App() {
  const [state, handleSubmit] = useForm("mljrgvwr")
  const [statementsOpen, setStatementsOpen] = useState(false)
  const [secondScreenVisible, setSecondScreenVisible] = useState(false)
  const [peekProgress, setPeekProgress] = useState(0)
  const [aboutPageReady, setAboutPageReady] = useState(false)
  const secondScreenVisibleRef = useRef(false)
  const scrollIntent = useRef(0)
  const touchStartY = useRef<number | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showAboutPage = useCallback(() => {
    setAboutPageReady(false)
    secondScreenVisibleRef.current = true
    setSecondScreenVisible(true)
    setPeekProgress(0)
  }, [])

  const showHomePage = useCallback(() => {
    setAboutPageReady(false)
    secondScreenVisibleRef.current = false
    setSecondScreenVisible(false)
    setPeekProgress(0)
  }, [])

  const pastePlainText = (
    event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    event.preventDefault()

    const field = event.currentTarget
    const text = event.clipboardData.getData('text/plain')
    const start = field.selectionStart ?? field.value.length
    const end = field.selectionEnd ?? start

    field.setRangeText(text, start, end, 'end')
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }

  useEffect(() => {
    const threshold = () => window.innerHeight * 0.15
    const resetPreview = () => {
      scrollIntent.current = 0
      setPeekProgress(0)
    }
    const scheduleReset = () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(resetPreview, 320)
    }
    const commitScreen = (visible: boolean) => {
      setAboutPageReady(false)
      secondScreenVisibleRef.current = visible
      setSecondScreenVisible(visible)
      resetPreview()
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }

    const handleWheel = (event: WheelEvent) => {
      const wantedDirection = secondScreenVisibleRef.current ? -1 : 1
      const directedDelta = event.deltaY * wantedDirection
      scrollIntent.current = Math.min(
        Math.max(scrollIntent.current + directedDelta, 0),
        threshold(),
      )
      const progress = scrollIntent.current / threshold()
      if (progress > 0) setAboutPageReady(false)
      setPeekProgress(progress)

      if (progress >= 1) {
        commitScreen(!secondScreenVisibleRef.current)
      } else if (progress <= 0) {
        if (resetTimer.current) clearTimeout(resetTimer.current)
      } else {
        scheduleReset()
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      touchStartY.current = event.touches[0]?.clientY ?? null
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (touchStartY.current === null) return

      const currentY = event.touches[0]?.clientY
      if (currentY === undefined) return

      const wantedDirection = secondScreenVisibleRef.current ? -1 : 1
      const distance =
        (touchStartY.current - currentY) * wantedDirection

      const progress = Math.min(
        Math.max(distance / threshold(), 0),
        1,
      )
      if (progress > 0) setAboutPageReady(false)
      setPeekProgress(progress)
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchStartY.current === null) return

      const endY = event.changedTouches[0]?.clientY
      if (endY === undefined) return

      const distance = touchStartY.current - endY
      const wantedDirection = secondScreenVisibleRef.current ? -1 : 1
      const directedDistance = distance * wantedDirection

      if (directedDistance >= threshold()) {
        commitScreen(!secondScreenVisibleRef.current)
      } else {
        resetPreview()
      }

      touchStartY.current = null
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    })
    window.addEventListener('touchmove', handleTouchMove, {
      passive: true,
    })
    window.addEventListener('touchend', handleTouchEnd, {
      passive: true,
    })

    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  // Keep the WebGL-heavy hero element stable while scroll gestures update the
  // about-page preview. This avoids reconciling three Canvas trees per frame.
  const hero = useMemo(
    () => (
      <section className="hero-page">
        <main className="main">
<div className="top-disc" aria-hidden="true" />

<div
  className={`brokerage-statements${
    statementsOpen ? ' is-open' : ''
  }`}
>
  <button
    type="button"
    className="brokerage-statements-button"
    onClick={() => setStatementsOpen((open) => !open)}
    aria-expanded={statementsOpen}
  >
    brokerage statements

    <span
      className={`brokerage-statements-arrow${
        statementsOpen ? ' is-open' : ''
      }`}
    >
      ▾
    </span>
  </button>

  <div
    className={`brokerage-statements-menu${
      statementsOpen ? ' is-open' : ''
    }`}
  >
    <a
      href={`${import.meta.env.BASE_URL}statements/2026-07.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      7/31/26
    </a>

    <a
      href={`${import.meta.env.BASE_URL}statements/2026-06.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      6/30/26
    </a>

    <a
      href={`${import.meta.env.BASE_URL}statements/2026-05.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      5/31/26
    </a>

    <a
      href={`${import.meta.env.BASE_URL}statements/2026-04.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      4/30/26
    </a>

    <a
      href={`${import.meta.env.BASE_URL}statements/2026-03.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      3/31/26
    </a>

    <a
      href={`${import.meta.env.BASE_URL}statements/2026-02.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      2/28/26
    </a>

    <a
      href={`${import.meta.env.BASE_URL}statements/2026-01.pdf`}
      target="_blank"
      rel="noreferrer"
    >
      1/31/26
    </a>
  </div>
</div>
<nav className="main-nav" aria-label="Primary navigation">
  <a
    href="https://www.myiclub.com/club/public/fairfaxinvestinggroup"
    target="_blank"
  >
    portal
  </a>

  <a
    href="https://docs.google.com/spreadsheets/d/15dNTf3uMPupanATPo7H9leXFXuRyI_O7v_Coev_tOaU/edit?gid=0#gid=0"
    target="_blank"
  >
    dashboard
  </a>

  <a
    href="https://medium.com/@fairfax.investing.group"
    target="_blank"
  >
    reports
  </a>
</nav>
      <nav className="main-nav" aria-label="Primary navigation">
        <a href="https://www.myiclub.com/club/public/fairfaxinvestinggroup" target="_blank">portal</a>
        <a href="https://docs.google.com/spreadsheets/d/15dNTf3uMPupanATPo7H9leXFXuRyI_O7v_Coev_tOaU/edit?gid=0#gid=0" target="_blank">dashboard</a>
        <a href="https://medium.com/@fairfax.investing.group" target="_blank">reports</a>
      </nav>
      <h1 className="title">
        <span>FAIRFAX</span>
        <span>INVESTING</span>
        <span>GROUP</span>
      </h1>
      <div className="title-inversion-mask" aria-hidden="true">
        <div className="title title--inverted">
          <span>FAIRFAX</span>
          <span>INVESTING</span>
          <span>GROUP</span>
        </div>
      </div>
      <button
        className="scroll-cue"
        type="button"
        aria-label="Scroll to the about page"
        onClick={showAboutPage}
      >
        <svg
          className="title-arrow"
          viewBox="0 0 48 28"
          aria-hidden="true"
        >
          <path d="M3 25 24 4l21 21" />
        </svg>
        <span className="scroll-label">scroll</span>
      </button>
      <p className="portfolio-caption">
        ~13,000 USD portfolio based in value-investing principals.
      </p>
      <div
        className="particle-overlay particle-overlay--inversion"
        aria-hidden="true"
      >
        <Canvas
          frameloop={aboutPageReady ? 'never' : 'always'}
          camera={{ position: [0, 0, 3], fov: 45 }}
          dpr={1}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
          }}
        >
          <SquareParticles
            color="#000000"
            opacity={1}
            inversion
          />
        </Canvas>
      </div>
      <div
        className="particle-overlay particle-overlay--color"
        aria-hidden="true"
      >
        <Canvas
          frameloop={aboutPageReady ? 'never' : 'always'}
          camera={{ position: [0, 0, 3], fov: 45 }}
          dpr={1}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
          }}
        >
          <SquareParticles color="#0b2f4f" opacity={0.46} />
        </Canvas>
      </div>
      <div className="scene">
        <Canvas 
          frameloop={aboutPageReady ? 'never' : 'always'}
          camera={{ position: [0, 0, 3], fov: 45 }}
          dpr={[1, 1.25]}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
          }}
        >
          <directionalLight position={[5, 7, 3.5]} intensity={6} />
          <group scale={1.25}>
            <Model position={[.95, -1.1, 0]} rotation={[0, degToRad(-15), 0]}/>
            <Model position={[.35, -.75, 0]} rotation={[0, degToRad(50), 0]}/>
            <Model position={[.88, -.2, 0]} rotation={[0, degToRad(-15), 0]}/>
          </group>

          <EffectComposer multisampling={0}>
            <DitherEffect 
              gridSize={1.5}
              grayscaleOnly={false}
            />
          </EffectComposer>
        </Canvas>
      </div>
        </main>
      </section>
    ),
[aboutPageReady, showAboutPage, statementsOpen],
)

  return (
    <>
      {hero}
      <section
        className={`black-page${aboutPageReady ? ' is-active' : ''}${
          peekProgress > 0 ? ' is-peeking' : ''
        }`}
        style={{
          '--slide-offset': `${
            secondScreenVisible
              ? peekProgress * 12
              : 100 - peekProgress * 12
          }%`,
        } as CSSProperties}
        aria-label="About Fairfax Investing Group"
        aria-hidden={!secondScreenVisible}
        onTransitionEnd={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.propertyName !== 'transform'
          ) return
          setAboutPageReady(secondScreenVisibleRef.current)
        }}
      >
        <div className="about-brand">
          <img
            src={`${import.meta.env.BASE_URL}images/FairfaxInvestingLogo.svg`}
            alt="Fairfax Investing Group"
          />
        </div>

        <svg
          className="about-geometry"
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect x="75" y="0" width="1456" height="900" />

          <path d="M975 0V900" />
          <path d="M975 556H1531" />
          <path d="M1187 556V900" />
          <path d="M975 688H1187" />
          <path d="M1107 556V688" />
          <path d="M1107 636H1187" />
          <path d="M1135 636V688" />
          <path d="M1107 660H1135" />
          <path d="M1124 660V688" />
          <path d="M1124 677H1135" />

          <path
            className="golden-spiral"
            d="
              M75 900
              A900 900 0 0 1 975 0
              A556 556 0 0 1 1531 556
              A344 344 0 0 1 1187 900
              A212 212 0 0 1 975 688
              A132 132 0 0 1 1107 556
              A80 80 0 0 1 1187 636
              A52 52 0 0 1 1135 688
            "
          />
        </svg>

        <button
          className="about-back"
          type="button"
          aria-label="Return to the home page"
          onClick={showHomePage}
        >
          <svg viewBox="0 0 52 30" aria-hidden="true">
            <path d="M3 3 26 27 49 3" />
          </svg>
        </button>

        <article className="about-copy">
          <h2>About Us</h2>
          <p>
            We are a group of students from Columbia and UVA who founded
            our own investment fund focused on value investing.
          </p>
          <p>We’d love to meet you! Please reach out.</p>
        </article>

        <TeamDeck />

        <section className="contact-panel" aria-labelledby="contact-heading">
          
          <h2 id="contact-heading">Contact Us</h2>
          <p className="contact-email">
            or email us at fairfax.investing.group@gmail.com
          </p>
          
            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
            >
            <label>
              <span className="sr-only">Your email</span>
              <input
                type="text"
                inputMode="email"
                name="email"
                placeholder="your email"
                autoComplete="one-time-code"
                data-1p-ignore
                data-lpignore="true"
                onPaste={pastePlainText}
              />
            </label>
            <label>
              <span className="sr-only">Your name</span>
              <input
                type="text"
                name="name"
                placeholder="your name"
                autoComplete="one-time-code"
                data-1p-ignore
                data-lpignore="true"
                onPaste={pastePlainText}
              />
            </label>
            <div className="message-field">
              <textarea
                aria-label="Your message"
                name="message"
                placeholder=" "
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                onPaste={pastePlainText}
              />
              <span aria-hidden="true">. . .</span>
            </div>
            <button type="submit" disabled={state.submitting}>
  {state.submitting ? 'sending...' : 'send'}
</button>

{state.succeeded && (
  <p className="form-success">Message sent. Thank you.</p>
)}

          </form>
        </section>
      </section>
    </>
  )
}
