import { useCallback, useState } from 'react';

import newsletterService from '@/services/newsletterService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const DEFAULT_TOPIC = 'weekly_hiring_insights';
const DEFAULT_CONSENT_TEXT =
  'Tôi đồng ý nhận bản tin HireBOT và hiểu rằng có thể hủy đăng ký bất cứ lúc nào.';

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getApiMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.meta?.message ||
    'Không thể đăng ký nhận bản tin lúc này. Vui lòng thử lại sau.'
  );
}

export default function useNewsletterSubscription({
  source = 'website',
  topic = DEFAULT_TOPIC,
  consentText = DEFAULT_CONSENT_TEXT,
  metadata,
} = {}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = useCallback(
    async (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        setStatus('error');
        setMessage('Vui lòng nhập email để nhận bản tin.');
        return false;
      }

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        setStatus('error');
        setMessage('Email chưa đúng định dạng. Ví dụ: ten@congty.com');
        return false;
      }

      setStatus('submitting');
      setMessage('');

      try {
        const response = await newsletterService.subscribe({
          email: normalizedEmail,
          source,
          topic,
          consent: true,
          consentText,
          metadata,
        });
        const subscriptionStatus = response?.data?.data?.subscriptionStatus;
        const serverMessage = response?.data?.meta?.message;

        setStatus(subscriptionStatus === 'already_subscribed' ? 'info' : 'success');
        setMessage(
          serverMessage ||
            (subscriptionStatus === 'already_subscribed'
              ? 'Email này đã có trong danh sách nhận bản tin.'
              : 'Đăng ký thành công. Cảm ơn bạn đã theo dõi HireBOT.')
        );
        setEmail('');
        return true;
      } catch (error) {
        setStatus('error');
        setMessage(getApiMessage(error));
        return false;
      }
    },
    [consentText, email, metadata, source, topic]
  );

  return {
    email,
    setEmail,
    status,
    message,
    isSubmitting: status === 'submitting',
    submit,
  };
}
