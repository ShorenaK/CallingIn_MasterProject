/** @param {{name: string, label: string, type?: string, autoComplete?: string, minLength?: number, maxLength?: number, defaultValue?: string, onInvalid?: import('react').FormEventHandler<HTMLInputElement>, onInput?: import('react').FormEventHandler<HTMLInputElement>, 'aria-describedby'?: string}} props */
export function Field({ name, label, type = 'text', ...rest }) {
  return (
    <label className="form-field" htmlFor={name}>
      <span>{label}</span>
      <input id={name} name={name} type={type} required {...rest} />
    </label>
  );
}

/** @param {{error: string, notice?: string}} props */
export function Feedback({ error, notice }) {
  return (
    <>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
}
