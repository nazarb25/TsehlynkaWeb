import { TelegramIcon } from '@/components/icons'

const ERRORS: Record<string, string> = {
  cancelled: 'Вхід скасовано в Telegram.',
  expired: 'Час на вхід минув. Спробуйте ще раз.',
  rejected: 'Telegram не підтвердив вхід. Спробуйте ще раз.',
  unavailable: 'Вхід зараз недоступний. Спробуйте за хвилину.',
}

export function loginHref(next: string): string {
  return `/auth/telegram?next=${encodeURIComponent(next)}`
}

/** Вміст входу: один спосіб, кнопка Telegram посередині. */
export function LoginPanel({ next, error, titleId }: { next: string; error?: string | null; titleId?: string }) {
  const message = error ? (ERRORS[error] ?? ERRORS.unavailable) : null
  return (
    <div className="login">
      <h2 className="login__title" id={titleId}>
        Вхід у Цеглинку
      </h2>
      <p className="login__text">Увійдіть, щоб зберігати набори й стежити за цінами</p>
      {message ? (
        <p className="login__error" role="alert">
          {message}
        </p>
      ) : null}
      <a className="login__telegram" href={loginHref(next)} data-track="login_started">
        <TelegramIcon />
        Увійти з Telegram
      </a>
    </div>
  )
}
