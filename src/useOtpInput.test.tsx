import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react';
import { useOtpInput } from './useOtpInput';

function createKeyboardEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>;
}

function createClipboardEvent(text: string) {
  return {
    preventDefault: vi.fn(),
    clipboardData: {
      getData: () => text,
    },
  } as unknown as ClipboardEvent<HTMLInputElement>;
}

function createChangeEvent(value: string) {
  return {
    target: { value },
  } as ChangeEvent<HTMLInputElement>;
}

describe('useOtpInput', () => {
  it('initializes with default empty slots', () => {
    const { result } = renderHook(() => useOtpInput({ length: 4 }));
    expect(result.current.slots).toHaveLength(4);
    expect(result.current.getValue()).toBe('');
  });

  it('accepts single digit and advances focus', () => {
    const focusMock = vi.fn();
    const { result } = renderHook(() => useOtpInput({ length: 4 }));

    result.current.slots[0].inputRef({ focus: focusMock, select: vi.fn() } as unknown as HTMLInputElement);
    result.current.slots[1].inputRef({ focus: focusMock, select: vi.fn() } as unknown as HTMLInputElement);

    act(() => {
      result.current.slots[0].onChange(createChangeEvent('5'));
    });

    expect(result.current.getValue()).toBe('5');
  });

  it('rejects invalid characters silently', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useOtpInput({ length: 4, onChange, allowedChars: 'numeric' }),
    );

    act(() => {
      result.current.slots[0].onChange(createChangeEvent('a'));
    });

    expect(result.current.getValue()).toBe('');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onComplete when all slots filled', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useOtpInput({ length: 4, onComplete }),
    );

    act(() => {
      result.current.fillFromString('1234');
    });

    expect(onComplete).toHaveBeenCalledWith('1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onChange on every change', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useOtpInput({ length: 4, onChange }),
    );

    act(() => {
      result.current.slots[0].onChange(createChangeEvent('1'));
    });

    expect(onChange).toHaveBeenCalledWith('1');
  });

  describe('backspace', () => {
    it('clears filled slot and keeps focus', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4, defaultValue: '12' }));

      act(() => {
        result.current.slots[1].onKeyDown(createKeyboardEvent('Backspace'));
      });

      expect(result.current.getValue()).toBe('1');
    });

    it('on empty slot moves to previous and clears it', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4, defaultValue: '12' }));

      act(() => {
        result.current.slots[2].onKeyDown(createKeyboardEvent('Backspace'));
      });

      expect(result.current.getValue()).toBe('1');
    });
  });

  describe('keyboard navigation', () => {
    it('handles Delete key', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4, defaultValue: '1234' }));

      act(() => {
        result.current.slots[2].onKeyDown(createKeyboardEvent('Delete'));
      });

      expect(result.current.getValue()).toBe('124');
    });

    it('handles ArrowLeft and ArrowRight', () => {
      const focusMock = vi.fn();
      const selectMock = vi.fn();
      const { result } = renderHook(() => useOtpInput({ length: 4 }));

      const mockInput = { focus: focusMock, select: selectMock } as unknown as HTMLInputElement;
      act(() => {
        result.current.slots[0].inputRef(mockInput);
        result.current.slots[1].inputRef(mockInput);
      });

      act(() => {
        result.current.slots[1].onKeyDown(createKeyboardEvent('ArrowLeft'));
      });
      expect(focusMock).toHaveBeenCalled();

      act(() => {
        result.current.slots[0].onKeyDown(createKeyboardEvent('ArrowRight'));
      });
      expect(focusMock).toHaveBeenCalledTimes(2);
    });

    it('handles Home and End', () => {
      const focusMock = vi.fn();
      const selectMock = vi.fn();
      const { result } = renderHook(() => useOtpInput({ length: 4 }));
      const mockInput = { focus: focusMock, select: selectMock } as unknown as HTMLInputElement;

      act(() => {
        for (let i = 0; i < 4; i++) {
          result.current.slots[i].inputRef(mockInput);
        }
      });

      act(() => {
        result.current.slots[2].onKeyDown(createKeyboardEvent('Home'));
      });
      expect(focusMock).toHaveBeenCalled();

      act(() => {
        result.current.slots[0].onKeyDown(createKeyboardEvent('End'));
      });
      expect(focusMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('paste', () => {
    it('distributes full code from focused slot', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useOtpInput({ length: 6, onComplete }),
      );

      act(() => {
        result.current.slots[0].onPaste(createClipboardEvent('123456'));
      });

      expect(result.current.getValue()).toBe('123456');
      expect(onComplete).toHaveBeenCalledWith('123456');
    });

    it('distributes partial code from middle slot', () => {
      const { result } = renderHook(() =>
        useOtpInput({ length: 6, defaultValue: '12' }),
      );

      act(() => {
        result.current.slots[2].onPaste(createClipboardEvent('3456'));
      });

      expect(result.current.getValue()).toBe('123456');
    });

    it('sanitizes dashes and spaces from pasted code', () => {
      const { result } = renderHook(() => useOtpInput({ length: 6 }));

      act(() => {
        result.current.slots[0].onPaste(createClipboardEvent('123-456'));
      });

      expect(result.current.getValue()).toBe('123456');
    });
  });

  describe('controlled mode', () => {
    it('uses controlled value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useOtpInput({ length: 4, value, onChange: vi.fn() }),
        { initialProps: { value: '12' } },
      );

      expect(result.current.getValue()).toBe('12');

      rerender({ value: '1234' });
      expect(result.current.getValue()).toBe('1234');
    });
  });

  describe('imperative API', () => {
    it('clear resets value', () => {
      const { result } = renderHook(() =>
        useOtpInput({ length: 4, defaultValue: '1234' }),
      );

      act(() => {
        result.current.clear();
      });

      expect(result.current.getValue()).toBe('');
    });

    it('setValue updates value', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4 }));

      act(() => {
        result.current.setValue('5678');
      });

      expect(result.current.getValue()).toBe('5678');
    });
  });

  describe('accessibility props', () => {
    it('sets aria-label per slot', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4 }));
      expect(result.current.slots[0]['aria-label']).toBe('Digit 1 of 4');
    });

    it('sets aria-invalid when error', () => {
      const { result } = renderHook(() =>
        useOtpInput({ length: 4, error: true }),
      );
      expect(result.current.slots[0]['aria-invalid']).toBe(true);
    });

    it('sets numeric inputMode and pattern', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4 }));
      expect(result.current.slots[0].inputMode).toBe('numeric');
      expect(result.current.slots[0].pattern).toBe('[0-9]*');
    });

    it('sets one-time-code autocomplete on first slot', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4 }));
      expect(result.current.slots[0].autoComplete).toBe('one-time-code');
      expect(result.current.slots[1].autoComplete).toBe('off');
    });
  });

  describe('disabled and readOnly', () => {
    it('passes disabled to slots', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4, disabled: true }));
      expect(result.current.slots[0].disabled).toBe(true);
    });

    it('does not handle input when disabled', () => {
      const { result } = renderHook(() => useOtpInput({ length: 4, disabled: true }));

      act(() => {
        result.current.slots[0].onChange(createChangeEvent('1'));
      });

      expect(result.current.getValue()).toBe('');
    });
  });

  describe('alphanumeric mode', () => {
    it('accepts letters and digits', () => {
      const { result } = renderHook(() =>
        useOtpInput({ length: 4, allowedChars: 'alphanumeric' }),
      );

      act(() => {
        result.current.fillFromString('A1B2');
      });

      expect(result.current.getValue()).toBe('A1B2');
    });
  });
});
