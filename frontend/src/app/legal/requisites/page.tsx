import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/LegalPage';
import { LEGAL, isRequisitesComplete } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Реквизиты — ФРИПЕТ',
  description:
    'Сведения об операторе платформы ФРИПЕТ: наименование, БИН/ИИН, адрес и контакты для обращений.',
};

const sections = [
  { id: 'operator', label: '1. Оператор' },
  { id: 'contacts', label: '2. Контакты' },
  { id: 'requests', label: '3. Официальные обращения' },
  { id: 'details', label: '4. Что уточнить' },
];

function Value({ value }: { value?: string }) {
  return value ? <>{value}</> : <span className="text-content-muted">не указано</span>;
}

export default function RequisitesPage() {
  return (
    <LegalPage
      title="Реквизиты"
      description="Сведения об операторе платформы и каналы для официальных обращений."
      currentHref="/legal/requisites"
      sections={sections}
    >
      <h2 id="operator">1. Оператор</h2>
      <div className="legal-table-wrap">
        <table>
          <tbody>
            <tr>
              <th scope="row">Наименование</th>
              <td>
                <Value value={LEGAL.operatorName} />
              </td>
            </tr>
            <tr>
              <th scope="row">Организационно-правовая форма</th>
              <td>
                <Value value={LEGAL.legalForm} />
              </td>
            </tr>
            <tr>
              <th scope="row">БИН / ИИН</th>
              <td>
                <Value value={LEGAL.bin} />
              </td>
            </tr>
            <tr>
              <th scope="row">Адрес</th>
              <td>
                <Value value={LEGAL.address} />
              </td>
            </tr>
            <tr>
              <th scope="row">Юрисдикция</th>
              <td>{LEGAL.jurisdiction}</td>
            </tr>
            <tr>
              <th scope="row">Сайт</th>
              <td>{LEGAL.siteUrl}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!isRequisitesComplete && (
        <div className="alert alert-warning" role="note">
          <span>
            Часть регистрационных сведений пока не опубликована. Полные реквизиты можно
            запросить по адресу{' '}
            <a className="underline underline-offset-2" href={`mailto:${LEGAL.email}`}>
              {LEGAL.email}
            </a>
            . Это не мешает пользоваться бесплатной платформой, но важно для официальных
            обращений и договоров.
          </span>
        </div>
      )}

      <h2 id="contacts">2. Контакты</h2>
      <ul>
        <li>
          Общие вопросы: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </li>
        <li>
          Персональные данные: <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>
        </li>
        <li>
          Поддержка и жалобы: <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
        </li>
        <li>
          Телефон: <Value value={LEGAL.phone} />
        </li>
      </ul>

      <h2 id="requests">3. Официальные обращения</h2>
      <p>
        Официальные обращения, претензии и запросы уполномоченных органов направляйте на{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Укажите тему, суть обращения,
        ссылки на материалы и контакт для ответа. Мы регистрируем обращение и отвечаем в течение
        10 рабочих дней, если закон не устанавливает иной срок.
      </p>
      <p>
        Запросы о персональных данных рассматриваются по правилам{' '}
        <Link href="/legal/privacy">Политики конфиденциальности</Link>. Запросы об удалении
        аккаунта — по инструкции на странице{' '}
        <Link href="/legal/data-deletion">«Удаление данных»</Link>.
      </p>

      <h2 id="details">4. Что уточнить</h2>
      <p>
        Если для договора, суда или официальной переписки нужны полные регистрационные данные,
        банковские реквизиты или документы, подтверждающие полномочия, запросите их письмом.
        Мы предоставим сведения в пределах закона и защитим данные от недобросовестных запросов.
      </p>
      <p>
        ФРИПЕТ — бесплатная платформа. Мы не принимаем платежи и не выставляем счета за
        передачу животных. Если вам пришёл счёт или требование оплаты от имени ФРИПЕТ, сообщите
        нам.
      </p>
    </LegalPage>
  );
}
