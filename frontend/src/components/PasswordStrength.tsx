'use client';

interface PasswordStrengthProps {
  password: string;
}

function checkPassword(password: string): { percent: number; label: string; color: string; textColor: string } {
  if (!password || password.length === 0) {
    return { percent: 0, label: '', color: '', textColor: '' };
  }

  let level = 0;

  if (password.length >= 6) level++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) level++;
  if (/[0-9]/.test(password)) level++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) level++;

  switch (level) {
    case 0:
      return { percent: 25, label: 'Плохо', color: 'bg-danger', textColor: 'text-danger-text' };
    case 1:
      return { percent: 25, label: 'Плохо', color: 'bg-danger', textColor: 'text-danger-text' };
    case 2:
      return { percent: 50, label: 'Слабо', color: 'bg-warning', textColor: 'text-warning-text' };
    case 3:
      return { percent: 75, label: 'Нормально', color: 'bg-warning', textColor: 'text-warning-text' };
    case 4:
      return { percent: 100, label: 'Хорошо', color: 'bg-success', textColor: 'text-success-text' };
    default:
      return { percent: 25, label: 'Плохо', color: 'bg-danger', textColor: 'text-danger-text' };
  }
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { percent, label, color, textColor } = checkPassword(password);

  const requirements = [
    { text: 'Минимум 6 символов', met: password.length >= 6 },
    { text: 'Большие и маленькие буквы', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { text: 'Цифры (0-9)', met: /[0-9]/.test(password) },
    { text: 'Спецсимволы (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
  ];

  return (
    <div className="surface-soft mt-3 p-3">
      <div className="flex items-center space-x-2 mb-2">
        <div
          className="flex-1 h-2 bg-surface-veil rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Надёжность пароля"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{label}</span>
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center space-x-2 text-xs">
            <span aria-hidden="true" className={req.met ? 'text-success-text' : 'text-content-faint'}>
              {req.met ? '✓' : '○'}
            </span>
            <span className={req.met ? 'text-success-text' : 'text-content-faint'}>{req.text}</span>
            <span className="sr-only">{req.met ? '— выполнено' : '— не выполнено'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
