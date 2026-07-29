/** Shared celebrate confetti for auth success (login / register). */
export function launchAuthConfetti() {
  if (typeof document === "undefined") return

  const colors = [
    "#FFC93C",
    "#12B886",
    "#3D8FE0",
    "#7C6BFF",
    "#FF5A3C",
    "#0E141B",
  ]

  for (let i = 0; i < 50; i += 1) {
    const el = document.createElement("span")
    el.className = "auth-confetti"
    el.style.left = `${Math.random() * 100}vw`
    el.style.background = colors[i % colors.length]
    el.style.animationDuration = `${2.4 + Math.random() * 1.8}s`
    el.style.animationDelay = `${Math.random() * 0.7}s`
    document.body.appendChild(el)
    window.setTimeout(() => el.remove(), 5000)
  }
}
