import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { OtpInput } from './OtpInput';
import type { OtpInputHandle } from './useOtpInput';
import './styles.css';

describe('OtpInput', () => {
  it('renders default styled inputs with length slots', () => {
    render(<OtpInput length={6} />);
    const inputs = screen.getAllByRole('textbox', { hidden: true }).filter(
      (el) => !el.classList.contains('otp-input__autofill-capture'),
    );
    // 6 visible slot inputs
    expect(inputs).toHaveLength(6);
  });

  it('works with zero props beyond length and onComplete', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput length={4} onComplete={onComplete} useDefaultStyles />);

    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );

    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');

    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <OtpInput length={6} groupLabel="Verification code" />,
    );
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('has role=group with accessible name', () => {
    render(<OtpInput length={6} groupLabel="Verification code" />);
    expect(screen.getByRole('group', { name: /Verification code, 6 digits/i })).toBeInTheDocument();
  });

  it('supports renderInput customization', () => {
    render(
      <OtpInput
        length={4}
        useDefaultStyles={false}
        renderInput={(props) => {
          const { inputRef, displayValue, index, ...inputProps } = props;
          return (
            <input
              {...inputProps}
              ref={inputRef}
              data-testid={`custom-${index}`}
              value={displayValue}
            />
          );
        }}
      />,
    );
    expect(screen.getByTestId('custom-0')).toBeInTheDocument();
    expect(screen.getByTestId('custom-3')).toBeInTheDocument();
  });

  it('supports renderSeparator and groups', () => {
    render(
      <OtpInput
        length={6}
        groups={[3, 3]}
        renderSeparator={() => '-'}
        useDefaultStyles
      />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('masks values when mask prop is set', async () => {
    const user = userEvent.setup();
    render(<OtpInput length={4} mask useDefaultStyles />);

    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );

    await user.type(inputs[0], '5');
    expect(inputs[0]).toHaveValue('•');
  });

  it('shows error state via aria-invalid and data-error', () => {
    render(<OtpInput length={4} error="Invalid code" useDefaultStyles />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('data-error', 'true');
  });

  it('disables inputs when disabled', () => {
    render(<OtpInput length={4} disabled useDefaultStyles />);
    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );
    inputs.forEach((input) => expect(input).toBeDisabled());
  });

  it('disables inputs when loading', () => {
    render(<OtpInput length={4} loading useDefaultStyles />);
    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );
    inputs.forEach((input) => expect(input).toBeDisabled());
  });

  it('renders loading indicator via renderLoading', () => {
    render(
      <OtpInput
        length={4}
        loading
        renderLoading={() => <span data-testid="loading">Verifying…</span>}
      />,
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('exposes imperative ref API', async () => {
    const ref = createRef<OtpInputHandle>();
    render(<OtpInput ref={ref} length={4} useDefaultStyles />);

    await act(async () => {
      ref.current?.setValue('1234');
    });
    expect(ref.current?.getValue()).toBe('1234');

    await act(async () => {
      ref.current?.clear();
    });
    expect(ref.current?.getValue()).toBe('');
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <OtpInput
          length={4}
          value={value}
          onChange={setValue}
          useDefaultStyles
        />
      );
    }

    render(<Controlled />);
    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );

    await user.type(inputs[0], '9');
    expect(inputs[0]).toHaveValue('9');
  });

  it('pastes full code into first slot', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput length={6} onComplete={onComplete} useDefaultStyles />);

    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );

    await user.click(inputs[0]);
    await user.paste('123456');

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('123456');
    });
  });

  it('sanitizes dirty pasted code with dashes and spaces', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OtpInput length={6} onComplete={onComplete} useDefaultStyles />);

    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );

    await user.click(inputs[0]);
    await user.paste('123-456');

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('123456');
    });
  });

  it('supports RTL direction', () => {
    const { container } = render(<OtpInput length={4} dir="rtl" useDefaultStyles />);
    expect(container.firstChild).toHaveAttribute('dir', 'rtl');
  });

  it('announces completion when announceComplete is enabled', async () => {
    const user = userEvent.setup();
    render(
      <OtpInput
        length={4}
        announceComplete
        completeAnnouncement="Code complete"
        useDefaultStyles
      />,
    );

    const inputs = screen.getAllByRole('textbox').filter(
      (el) => el.classList.contains('otp-input__slot'),
    );

    await user.type(inputs[0], '1');
    await user.type(inputs[1], '2');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');

    await waitFor(() => {
      expect(screen.getByText('Code complete')).toBeInTheDocument();
    });
  });

  it('handles WebOTP autofill via fillFromString mock', async () => {
    const onComplete = vi.fn();
    render(<OtpInput length={6} onComplete={onComplete} enableWebOtp useDefaultStyles />);

    // Simulate autofill via hidden capture input
    const hiddenInput = document.querySelector('.otp-input__autofill-capture') as HTMLInputElement;
    expect(hiddenInput).toBeTruthy();

    fireEvent.change(hiddenInput, { target: { value: '987654' } });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('987654');
    });
  });
});
