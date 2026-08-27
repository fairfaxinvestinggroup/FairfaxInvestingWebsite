import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import gsap from 'gsap'

const team = [
  {
    name: 'Titus Er',
    role: 'General Partner · Co-Founder',
    detail: 'University of Virginia · President',
    image: `${import.meta.env.BASE_URL}images/Titus.png`,
    linkedin: 'https://www.linkedin.com/in/titus-er-3b545a321/',
  },
  {
    name: 'Claire Mo',
    role: 'General Partner · Co-Founder',
    detail: 'Columbia University · Vice-President',
    image: `${import.meta.env.BASE_URL}images/Claire.png`,
    linkedin: 'https://www.linkedin.com/in/claire-mo-3495343a8/',
  },
  {
    name: 'Thomas Duong',
    role: 'General Partner · Co-Founder',
    detail: 'University of Virginia · Treasurer',
    image: `${import.meta.env.BASE_URL}images/Thomas.png`,
    linkedin: 'https://www.linkedin.com/in/thomas-duong-5355963a8/',
  },
  {
    name: 'Kyle Li',
    role: 'General Partner · Co-Founder',
    detail: 'Columbia University · Secretary',
    image: `${import.meta.env.BASE_URL}images/Kyle.png`,
    linkedin: 'https://www.linkedin.com/in/kyle-li-869a1233a/',
  },
]

const fan = [
  { x: 0, y: 6, rotation: -4 },
  { x: 7, y: 3, rotation: -2 },
  { x: 14, y: 0, rotation: 1 },
  { x: 21, y: 3, rotation: 5 },
]

const hoverFan = [
  { x: 0, y: 8, rotation: -6 },
  { x: 12, y: 3, rotation: -3 },
  { x: 24, y: -1, rotation: 2 },
  { x: 36, y: 4, rotation: 7 },
]

export function TeamDeck() {
  const root = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const [dealt, setDealt] = useState(false)
  const [returning, setReturning] = useState(false)
  const [animating, setAnimating] = useState(false)
  const dealtRef = useRef(false)
  const returningRef = useRef(false)
  const animatingRef = useRef(false)

  const placeFan = (immediate = false) => {
    cardRefs.current.forEach((card, index) => {
      if (!card) return
      gsap[immediate ? 'set' : 'to'](card, {
        x: fan[index].x,
        y: fan[index].y,
        rotationX: 0,
        rotationY: 0,
        rotationZ: fan[index].rotation,
        scale: 1,
        boxShadow: '0 4px 8px rgba(0,0,0,.14), 0 16px 30px rgba(0,0,0,.2)',
        duration: immediate ? undefined : 0.45,
        ease: 'power3.out',
        clearProps: 'transformOrigin',
      })
    })
  }

  useLayoutEffect(() => {
    placeFan(true)
    return () => {
      timeline.current?.kill()
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (dealtRef.current) deal(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getLanding = (card: HTMLElement, index: number) => {
    const rootRect = root.current!.getBoundingClientRect()
    const deckRect = card.parentElement!.getBoundingClientRect()
    const cardWidth = card.offsetWidth
    const cardHeight = card.offsetHeight
    const mobile = rootRect.width < 700
    const xPercent = mobile ? [0.24, 0.76, 0.24, 0.76][index] : [0.19, 0.4, 0.62, 0.83][index]
    const yPercent = mobile ? [0.27, 0.27, 0.69, 0.69][index] : [0.5, 0.46, 0.49, 0.48][index]

    return {
      x:
        rootRect.left + rootRect.width * xPercent
        - deckRect.left - cardWidth / 2,
      y:
        rootRect.top + rootRect.height * yPercent
        - deckRect.top - cardHeight / 2,
      rotation: [-3, -1, 3, 7][index],
    }
  }

  const deal = (immediate = false) => {
    if (!root.current) return
    timeline.current?.kill()
    const cards = cardRefs.current
    const order = [3, 2, 1, 0]

    if (immediate) {
      cards.forEach((card, index) => {
        if (!card) return
        const landing = getLanding(card, index)
        gsap.set(card, {
          x: landing.x,
          y: landing.y,
          rotationX: 0,
          rotationY: 0,
          rotationZ: landing.rotation,
          scale: 1,
          boxShadow: '0 4px 8px rgba(0,0,0,.14), 0 16px 30px rgba(0,0,0,.2)',
        })
      })
      return
    }

    animatingRef.current = true
    setAnimating(true)
    const tl = gsap.timeline({
      onComplete: () => {
        animatingRef.current = false
        setAnimating(false)
      },
    })
    timeline.current = tl

    order.forEach((index, sequence) => {
      const card = cards[index]
      if (!card) return
      const landing = getLanding(card, index)
      const start = sequence * 0.045

      tl.set(card, { zIndex: 20 + index }, start)
        .to(card, {
          x: landing.x,
          y: landing.y,
          rotationX: 0,
          rotationY: 0,
          rotationZ: landing.rotation,
          scale: 1,
          boxShadow: '0 4px 8px rgba(0,0,0,.14), 0 16px 30px rgba(0,0,0,.2)',
          force3D: true,
          duration: 0.5,
          ease: 'power3.inOut',
        }, start)
    })

    dealtRef.current = true
    returningRef.current = false
    setReturning(false)
    setDealt(true)
  }

  const gather = () => {
    timeline.current?.kill()
    returningRef.current = true
    animatingRef.current = true
    setReturning(true)
    setAnimating(true)
    timeline.current = gsap.timeline({
      onComplete: () => {
        dealtRef.current = false
        returningRef.current = false
        animatingRef.current = false
        setReturning(false)
        setAnimating(false)
        setDealt(false)
      },
    })
    ;[0, 1, 2, 3].forEach((index, sequence) => {
      const card = cardRefs.current[index]
      if (!card) return
      timeline.current!.to(card, {
        x: fan[index].x,
        y: fan[index].y,
        rotationX: 0,
        rotationY: 0,
        rotationZ: fan[index].rotation,
        scale: 1,
        boxShadow: '0 4px 8px rgba(0,0,0,.14), 0 16px 30px rgba(0,0,0,.2)',
        duration: 0.5,
        ease: 'power3.inOut',
      }, sequence * 0.045)
    })
  }

  const hover = (spread: boolean) => {
    if (dealtRef.current) return
    cardRefs.current.forEach((card, index) => {
      if (!card) return
      const target = spread ? hoverFan[index] : fan[index]
      gsap.to(card, {
        x: target.x,
        y: target.y,
        rotationZ: target.rotation,
        duration: 0.36,
        ease: 'power2.out',
      })
    })
  }

  const hoverCard = (index: number, hovering: boolean) => {
    const card = cardRefs.current[index]
    if (!card || animatingRef.current) return
    const target = dealtRef.current
      ? getLanding(card, index)
      : {
          y: fan[index].y,
          rotation: fan[index].rotation,
        }

    gsap.to(card, {
      y: hovering ? target.y - 10 : target.y,
      rotationZ: hovering ? target.rotation * 0.65 : target.rotation,
      scale: hovering ? 1.025 : 1,
      boxShadow: hovering
        ? '0 8px 16px rgba(0,0,0,.18), 0 22px 40px rgba(0,0,0,.26)'
        : '0 4px 8px rgba(0,0,0,.14), 0 16px 30px rgba(0,0,0,.2)',
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  const openLinkedIn = (url: string) => {
    if (!dealtRef.current) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={`team-deck${dealt ? ' is-dealt' : ''}${returning ? ' is-returning' : ''}${animating ? ' is-animating' : ''}`}
      ref={root}
    >
      <div className="team-cards" aria-live="polite">
        {team.map((member, index) => (
          <article
            className="team-card"
            key={member.name}
            ref={(node) => { cardRefs.current[index] = node }}
            onMouseEnter={() => hoverCard(index, true)}
            onMouseLeave={() => hoverCard(index, false)}
            onClick={() => openLinkedIn(member.linkedin)}
            onKeyDown={(event) => {
              if (!dealtRef.current || (event.key !== 'Enter' && event.key !== ' ')) return
              event.preventDefault()
              openLinkedIn(member.linkedin)
            }}
            role={dealt ? 'link' : undefined}
            tabIndex={dealt ? 0 : -1}
            aria-label={dealt ? `Open ${member.name}'s LinkedIn profile` : undefined}
            style={{
              '--card-index': index,
              '--fan-x': `${fan[index].x}px`,
              '--fan-y': `${fan[index].y}px`,
              '--fan-rotation': `${fan[index].rotation}deg`,
            } as CSSProperties}
          >
            <div className="team-card__frame">
              <span className="team-card__number">0{index + 1}</span>
              <div className="team-card__portrait">
                <img
                  src={member.image}
                  alt={`${member.name}, ${member.role}`}
                  decoding="async"
                />
              </div>
              <div className="team-card__copy">
                <p>{member.role}</p>
                <h3>{member.name}</h3>
                <span>{member.detail}</span>
              </div>
              <span className="team-card__monogram">FIG</span>
            </div>
          </article>
        ))}
      </div>
      <button
        className="team-deal-button"
        type="button"
        onClick={() => dealt ? gather() : deal()}
        onMouseEnter={() => hover(true)}
        onMouseLeave={() => hover(false)}
        aria-expanded={dealt}
      >
        <span>{dealt ? 'Return the cards' : 'Meet Our Team'}</span>
      </button>
    </div>
  )
}
