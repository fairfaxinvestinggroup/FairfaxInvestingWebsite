import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import gsap from 'gsap'

const BASE_URL = import.meta.env.BASE_URL
const RESTING_SHADOW = '0 4px 8px rgba(0,0,0,.14), 0 16px 30px rgba(0,0,0,.2)'
const HOVER_SHADOW = '0 8px 16px rgba(0,0,0,.18), 0 22px 40px rgba(0,0,0,.26)'
const DEAL_ORDER = [7, 6, 5, 4, 3, 2, 1, 0]
const RETURN_ORDER = [0, 1, 2, 3, 4, 5, 6, 7]
const ACTION_CARD_INDICES = [4, 5, 6, 7]

const team = [
  {
    name: 'Titus Er',
    role: 'General Partner · Co-Founder',
    detail: 'University of Virginia · President',
    image: `${BASE_URL}images/Titus.png`,
    actionImage: `${BASE_URL}images/Titus_Action_Photo.jpeg`,
    actionLink: 'https://www.vsba.org/news/press-releases/news-release-vsba-board-of-directors-northeastern-region-regional-scholarship-recipient-announced/',
    linkedin: 'https://www.linkedin.com/in/titus-er-3b545a321/',
  },
  {
    name: 'Claire Mo',
    role: 'General Partner · Co-Founder',
    detail: 'Columbia University · Vice-President',
    image: `${BASE_URL}images/Claire.png`,
    actionImage: `${BASE_URL}images/Claire_Action_Photo.jpg`,
    actionLink: 'https://gocolumbialions.com/sports/womens-volleyball/roster/claire-mo/23914',
    linkedin: 'https://www.linkedin.com/in/claire-mo-3495343a8/',
  },
  {
    name: 'Thomas Duong',
    role: 'General Partner · Co-Founder',
    detail: 'University of Virginia · Treasurer',
    image: `${BASE_URL}images/Thomas.png`,
    actionImage: `${BASE_URL}images/Thomas_Action_Photo.JPG`,
    actionLink: 'https://www.fcps.edu/news/four-fcps-student-projects-win-grand-prize-2025-virginia-state-science-fair',
    linkedin: 'https://www.linkedin.com/in/thomas-duong-5355963a8/',
  },
  {
    name: 'Kyle Li',
    role: 'General Partner · Co-Founder',
    detail: 'Columbia University · Secretary',
    image: `${BASE_URL}images/Kyle.png`,
    actionImage: `${BASE_URL}images/Kyle_Action_Photo.jpeg`,
    actionLink: 'https://gocolumbialions.com/sports/mens-swimming-and-diving/roster/kyle-li/22878',
    linkedin: 'https://www.linkedin.com/in/kyle-li-869a1233a/',
  },
]

const deckCards = [
  ...team.map((member, memberIndex) => ({
    member,
    memberIndex,
    kind: 'headshot' as const,
  })),
  ...team.map((member, memberIndex) => ({
    member,
    memberIndex,
    kind: 'action' as const,
  })),
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

const pairLayer = (memberIndex: number) => 20 + memberIndex * 10

const dealtLayer = (
  memberIndex: number,
  kind: 'headshot' | 'action',
) => pairLayer(memberIndex) + (kind === 'headshot' ? 1 : 0)

export function TeamDeck() {
  const root = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLElement | null>>([])
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const [dealt, setDealt] = useState(false)
  const [returning, setReturning] = useState(false)
  const [animating, setAnimating] = useState(false)
  const dealtRef = useRef(false)
  const animatingRef = useRef(false)

  const placeFan = (immediate = false) => {
    cardRefs.current.forEach((card, cardIndex) => {
      if (!card) return
      const { memberIndex } = deckCards[cardIndex]
      gsap[immediate ? 'set' : 'to'](card, {
        x: fan[memberIndex].x,
        y: fan[memberIndex].y,
        rotationX: 0,
        rotationY: 0,
        rotationZ: fan[memberIndex].rotation,
        scale: 1,
        zIndex: pairLayer(memberIndex) + (
          deckCards[cardIndex].kind === 'action' ? 1 : 0
        ),
        boxShadow: RESTING_SHADOW,
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
    let resizeFrame = 0
    const handleResize = () => {
      if (!dealtRef.current || resizeFrame) return
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        deal(true)
      })
    }
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const getLanding = (
    card: HTMLElement,
    memberIndex: number,
    kind: 'headshot' | 'action' = 'headshot',
  ) => {
    const rootRect = root.current!.getBoundingClientRect()
    const deckRect = card.parentElement!.getBoundingClientRect()
    const cardWidth = card.offsetWidth
    const cardHeight = card.offsetHeight
    const mobile = rootRect.width < 700
    const xPercent = mobile ? [0.2, 0.76, 0.2, 0.76][memberIndex] : [0.14, 0.37, 0.61, 0.84][memberIndex]
    const yPercent = mobile ? [0.32, 0.32, 0.66, 0.66][memberIndex] : [0.5, 0.46, 0.49, 0.48][memberIndex]

    const landing = {
      x:
        rootRect.left + rootRect.width * xPercent
        - deckRect.left - cardWidth / 2,
      y:
        rootRect.top + rootRect.height * yPercent
        - deckRect.top - cardHeight / 2,
      rotation: (mobile ? [-3, -1, 3, -4] : [-3, -1, 3, 7])[memberIndex],
    }

    if (kind === 'action') {
      const direction = memberIndex % 2 === 0 ? -1 : 1
      landing.x += direction * (mobile ? 10 : 14)
      landing.y -= mobile ? 11 : 15
      landing.rotation += direction * 2
    }

    return landing
  }

  const deal = (immediate = false) => {
    if (!root.current) return
    timeline.current?.kill()
    const cards = cardRefs.current
    if (immediate) {
      cards.forEach((card, cardIndex) => {
        if (!card) return
        const deckCard = deckCards[cardIndex]
        const landing = getLanding(card, deckCard.memberIndex, deckCard.kind)
        gsap.set(card, {
          x: landing.x,
          y: landing.y,
          rotationX: 0,
          rotationY: 0,
          rotationZ: landing.rotation,
          scale: 1,
          zIndex: dealtLayer(deckCard.memberIndex, deckCard.kind),
          boxShadow: RESTING_SHADOW,
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

    DEAL_ORDER.forEach((cardIndex, sequence) => {
      const card = cards[cardIndex]
      if (!card) return
      const deckCard = deckCards[cardIndex]
      const landing = getLanding(card, deckCard.memberIndex, deckCard.kind)
      const start = sequence < 4
        ? sequence * 0.045
        : 0.82 + (sequence - 4) * 0.045

      tl.set(card, {
        zIndex: dealtLayer(deckCard.memberIndex, deckCard.kind),
      }, start)
        .to(card, {
          x: landing.x,
          y: landing.y,
          rotationX: 0,
          rotationY: 0,
          rotationZ: landing.rotation,
          scale: 1,
          boxShadow: RESTING_SHADOW,
          force3D: true,
          duration: 0.5,
          ease: 'power3.inOut',
        }, start)
    })

    dealtRef.current = true
    setReturning(false)
    setDealt(true)
  }

  const gather = () => {
    timeline.current?.kill()
    animatingRef.current = true
    setReturning(true)
    setAnimating(true)
    timeline.current = gsap.timeline({
      onComplete: () => {
        dealtRef.current = false
        animatingRef.current = false
        placeFan(true)
        setReturning(false)
        setAnimating(false)
        setDealt(false)
      },
    })

    ACTION_CARD_INDICES.forEach((cardIndex) => {
      const card = cardRefs.current[cardIndex]
      if (!card) return
      timeline.current!.set(
        card,
        { zIndex: pairLayer(deckCards[cardIndex].memberIndex) + 2 },
        0.7,
      )
    })

    RETURN_ORDER.forEach((cardIndex, sequence) => {
      const card = cardRefs.current[cardIndex]
      if (!card) return
      const { memberIndex } = deckCards[cardIndex]
      const start = sequence < 4
        ? sequence * 0.045
        : 0.72 + (sequence - 4) * 0.045
      timeline.current!.to(card, {
        x: fan[memberIndex].x,
        y: fan[memberIndex].y,
        rotationX: 0,
        rotationY: 0,
        rotationZ: fan[memberIndex].rotation,
        scale: 1,
        boxShadow: RESTING_SHADOW,
        duration: 0.5,
        ease: 'power3.inOut',
      }, start)
    })
  }

  const hover = (spread: boolean) => {
    if (dealtRef.current) return
    cardRefs.current.forEach((card, cardIndex) => {
      if (!card) return
      const { memberIndex } = deckCards[cardIndex]
      const target = spread ? hoverFan[memberIndex] : fan[memberIndex]
      gsap.to(card, {
        x: target.x,
        y: target.y,
        rotationZ: target.rotation,
        duration: 0.36,
        ease: 'power2.out',
      })
    })
  }

  const hoverCard = (
    cardIndex: number,
    memberIndex: number,
    kind: 'headshot' | 'action',
    hovering: boolean,
  ) => {
    const card = cardRefs.current[cardIndex]
    if (!card || animatingRef.current) return
    const target = dealtRef.current
      ? getLanding(card, memberIndex, kind)
      : {
          y: fan[memberIndex].y,
          rotation: fan[memberIndex].rotation,
        }

    gsap.to(card, {
      y: hovering ? target.y - 10 : target.y,
      rotationZ: hovering ? target.rotation * 0.65 : target.rotation,
      scale: hovering ? 1.025 : 1,
      zIndex: kind === 'action'
        ? (
            hovering
              ? pairLayer(memberIndex) + 2
              : dealtLayer(memberIndex, kind)
          )
        : undefined,
      boxShadow: hovering
        ? HOVER_SHADOW
        : RESTING_SHADOW,
      duration: 0.25,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  }

  const openCardLink = (url: string) => {
    if (!dealtRef.current) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={`team-deck${dealt ? ' is-dealt' : ''}${returning ? ' is-returning' : ''}${animating ? ' is-animating' : ''}`}
      ref={root}
    >
      <div className="team-cards" aria-live="polite">
        {deckCards.map(({ member, memberIndex, kind }, cardIndex) => (
          <article
            className={`team-card team-card--${kind} team-card--member-${memberIndex}`}
            key={`${member.name}-${kind}`}
            ref={(node) => { cardRefs.current[cardIndex] = node }}
            onMouseEnter={() => hoverCard(cardIndex, memberIndex, kind, true)}
            onMouseLeave={() => hoverCard(cardIndex, memberIndex, kind, false)}
            onClick={() => openCardLink(
              kind === 'action' ? member.actionLink : member.linkedin,
            )}
            onKeyDown={(event) => {
              if (
                !dealtRef.current ||
                (event.key !== 'Enter' && event.key !== ' ')
              ) return
              event.preventDefault()
              openCardLink(
                kind === 'action' ? member.actionLink : member.linkedin,
              )
            }}
            role={dealt ? 'link' : undefined}
            tabIndex={dealt ? 0 : -1}
            aria-label={
              dealt
                ? `Open ${member.name}'s ${
                    kind === 'action' ? 'feature' : 'LinkedIn profile'
                  }`
                : undefined
            }
            style={{
              '--card-index': cardIndex,
              '--fan-x': `${fan[memberIndex].x}px`,
              '--fan-y': `${fan[memberIndex].y}px`,
              '--fan-rotation': `${fan[memberIndex].rotation}deg`,
            } as CSSProperties}
          >
            <div className="team-card__frame">
              <span className="team-card__number">0{memberIndex + 1}</span>
              <div className="team-card__portrait">
                <img
                  src={kind === 'action' ? member.actionImage : member.image}
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
        disabled={animating}
      >
        <span>{dealt ? 'return the cards' : 'meet our team'}</span>
      </button>
    </div>
  )
}
