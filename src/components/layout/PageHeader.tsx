import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  /** Pequeno rótulo em maiúsculas acima do título. */
  eyebrow?: string
  /** Exibe seta de voltar como link para esta rota. */
  backTo?: string
  /** Exibe seta de voltar com callback (tem prioridade sobre backTo). */
  onBack?: () => void
  /** Exibe um "chip" de logo da marca à esquerda (quando não há botão de voltar). */
  logo?: string | null
  /** Mostra o chip de logo mesmo sem logo definido (ícone padrão). */
  showLogo?: boolean
  /** Ações à direita (ícones, botões). */
  actions?: ReactNode
}

export function PageHeader({ title, eyebrow, backTo, onBack, logo, showLogo, actions }: PageHeaderProps) {
  const hasBack = Boolean(backTo || onBack)

  return (
    <header className="bg-cream/80 backdrop-blur-md border-b border-ink-100 sticky top-0 z-10">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {hasBack &&
            (backTo && !onBack ? (
              <Link
                to={backTo}
                className="-ml-1.5 p-1.5 hover:bg-ink-100 rounded-lg text-ink-700 transition-colors"
                aria-label="Voltar"
              >
                <ChevronLeft size={20} />
              </Link>
            ) : (
              <button
                onClick={onBack}
                className="-ml-1.5 p-1.5 hover:bg-ink-100 rounded-lg text-ink-700 transition-colors"
                aria-label="Voltar"
              >
                <ChevronLeft size={20} />
              </button>
            ))}

          {!hasBack && (showLogo || logo) && (
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-ink-900 flex items-center justify-center ring-1 ring-brand-400/30">
              {logo ? (
                <img src={logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand-400 text-lg">✂</span>
              )}
            </div>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-wider text-ink-400 leading-none mb-0.5 truncate">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display font-bold uppercase tracking-wide text-ink-900 text-lg leading-tight truncate">
              {title}
            </h1>
          </div>
        </div>

        {actions && <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}
