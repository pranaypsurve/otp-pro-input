import type { PlaygroundConfig } from './config';
import { resolveAllowedChars, resolveGroups } from './config';

export function generateCodeSnippet(config: PlaygroundConfig): string {
  const groups = resolveGroups(config.length, config.groupsPreset, config.customGroups);
  const allowed = resolveAllowedChars(config.allowedCharsMode, config.customPattern);

  const props: string[] = [`length={${config.length}}`];

  if (config.controlMode === 'controlled') {
    props.push('value={code}');
    props.push('onChange={setCode}');
  }

  props.push('onComplete={handleComplete}');

  if (allowed !== 'numeric') {
    props.push(
      config.allowedCharsMode === 'alphanumeric'
        ? `allowedChars="alphanumeric"`
        : `allowedChars={/${config.customPattern.replace(/^\[|\]$/g, '')}/}`,
    );
  }

  if (config.autoFocus) props.push('autoFocus');
  if (config.disabled) props.push('disabled');
  if (config.readOnly) props.push('readOnly');
  if (config.loading) props.push('loading');
  if (config.errorEnabled) {
    props.push(config.errorMessage ? `error="${config.errorMessage}"` : 'error');
  }
  if (config.maskEnabled) {
    props.push(config.maskChar !== '•' ? `mask="${config.maskChar}"` : 'mask');
  }
  if (groups) props.push(`groups={[${groups.join(', ')}]}`);
  if (config.separatorEnabled) {
    props.push(`renderSeparator={() => '${config.separatorChar}'}`);
  }
  if (config.dir === 'rtl') props.push('dir="rtl"');
  if (config.groupLabel !== 'One-time passcode') {
    props.push(`groupLabel="${config.groupLabel}"`);
  }
  if (config.enableWebOtp) props.push('enableWebOtp');
  if (!config.enableAutofill) props.push('enableAutofill={false}');
  if (config.announceComplete) {
    props.push(
      config.completeAnnouncement !== 'Verification code complete'
        ? `announceComplete\n  completeAnnouncement="${config.completeAnnouncement}"`
        : 'announceComplete',
    );
  }
  if (config.inputName && config.inputName !== 'otp') {
    props.push(`name="${config.inputName}"`);
  }
  if (config.customSlotLabels) {
    props.push('getSlotLabel={(i, len) => `Character ${i + 1} of ${len}`}');
  }
  if (config.previewMode !== 'default' || !config.useDefaultStyles) {
    props.push('useDefaultStyles={false}');
    props.push('renderInput={(props) => { /* ... */ }}');
  }

  const propsBlock = props.map((p) => `  ${p}`).join('\n');

  return `import { OtpInput } from 'otp-pro-input';
import 'otp-pro-input/styles.css';

<OtpInput
${propsBlock}
/>`;
}
