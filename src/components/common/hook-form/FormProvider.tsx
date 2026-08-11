'use client';

import { FormProvider as Form, type UseFormReturn } from 'react-hook-form';

interface FormProviderProps {
  children: React.ReactNode;
  // Loose typing here matches the jobreef-admin reference — avoids generic-variance
  // headaches when a schema uses transforms or array/enum types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  methods: UseFormReturn<any>;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
}

/**
 * Thin wrapper around RHF's FormProvider + a native <form>.
 * Lets every RHF* field inside use `useFormContext()` instead of drilling `control`.
 */
function FormProvider({
  children,
  methods,
  onSubmit,
  className,
}: FormProviderProps) {
  return (
    <Form {...methods}>
      <form onSubmit={onSubmit} noValidate className={className}>
        <fieldset disabled={methods.formState.isSubmitting} className="contents">
          {children}
        </fieldset>
      </form>
    </Form>
  );
}

export { FormProvider };
