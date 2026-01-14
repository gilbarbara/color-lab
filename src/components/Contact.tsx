import { type FormEvent, type ReactNode, useRef } from 'react';
import { ASYNC_STATUS, request } from '@gilbarbara/helpers';
import { useSetState } from '@gilbarbara/hooks';
import { Button, Divider, useDisclosure } from '@heroui/react';
import { CheckCircleIcon, WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react';

import { Input, Textarea } from '~/components/Field';
import Modal, { ModalBody, ModalContent, ModalHeader } from '~/components/Modal';

interface Form extends HTMLFormElement {
  elements: HTMLFormControlsCollection & {
    email: HTMLInputElement;
    message: HTMLInputElement;
    name: HTMLInputElement;
  };
}

interface State {
  errorMessage: string | null;
  messageLengthError: string | null;
  status: keyof typeof ASYNC_STATUS;
}

const defaultState: State = {
  errorMessage: '',
  messageLengthError: null,
  status: ASYNC_STATUS.IDLE,
};

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);

  const [{ errorMessage, messageLengthError, status }, setState] = useSetState<State>(defaultState);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleClickOpen = () => {
    setState(defaultState);
    onOpen();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { email, message } = (event.target as Form).elements;

    if (message.value.length < 10) {
      setState({
        messageLengthError: 'The message must be at least 10 characters long.',
      });

      return;
    }

    setState({ errorMessage: undefined, messageLengthError: null, status: ASYNC_STATUS.PENDING });

    try {
      await request('https://submit-form.com/OsJcU0zeI', {
        method: 'POST',
        body: { email: email.value, message: message.value },
      });
      setState({ status: ASYNC_STATUS.SUCCESS });

      formRef.current?.reset();
    } catch {
      setState({ errorMessage: 'Failed to send. Try again.', status: ASYNC_STATUS.ERROR });
    }
  };

  let feedback: ReactNode = null;

  if (messageLengthError) {
    feedback = (
      <>
        <WarningCircleIcon className="text-2xl shrink-0" />
        <span>{messageLengthError}</span>
      </>
    );
  } else if (errorMessage) {
    feedback = (
      <>
        <XCircleIcon className="text-2xl shrink-0" />
        <span>{errorMessage}</span>
      </>
    );
  } else if (status === ASYNC_STATUS.SUCCESS) {
    feedback = (
      <>
        <CheckCircleIcon className="text-2xl shrink-0" />
        <span>Message sent successfully</span>
      </>
    );
  }

  return (
    <div data-uid="Contact">
      <button className="text-base" onClick={handleClickOpen} type="button">
        Feedback
      </button>
      {isOpen && (
        <Modal isOpen={isOpen} onClose={onOpenChange} size="lg">
          <ModalContent>
            <ModalHeader>Feedback</ModalHeader>
            <Divider />
            <form ref={formRef} onSubmit={handleSubmit}>
              <ModalBody>
                <Textarea
                  labelPlacement="inside"
                  name="message"
                  placeholder="Your feedback, suggestions or bug reports"
                  required
                />

                <Input name="email" placeholder="Your e-mail address" required type="email" />
                <div className="flex gap-4 items-center">
                  <Button isLoading={status === ASYNC_STATUS.PENDING} type="submit">
                    Send
                  </Button>
                  <div className="flex items-center text-sm/4 gap-1">{feedback}</div>
                </div>
              </ModalBody>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
