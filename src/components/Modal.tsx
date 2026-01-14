import { isValidElement, type ReactNode } from 'react';
import {
  Divider,
  Modal as HeroUIModal,
  type ModalProps as HeroUIModalProps,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';

import useMergeClassNames from '~/hooks/useMergeClassNames';

type MaxWidth =
  /** 20rem (320px) */
  | 'xs'
  /** 24rem (384px) */
  | 'sm'
  /** 28rem (448px) */
  | 'md'
  /** 32rem (512px) */
  | 'lg'
  /** 36rem (576px) */
  | 'xl'
  /** 42rem (672px) */
  | '2xl'
  /** 48rem (768px) */
  | '3xl'
  /** 56rem (896px) */
  | '4xl'
  /** 64rem (1024px) */
  | '5xl';

export interface ModalProps extends HeroUIModalProps {
  /**
   * Optional footer content. Only used when children don't contain ModalContent.
   */
  footer?: ReactNode;
  /**
   * Optional header content. Only used when children don't contain ModalContent.
   * For simple modals, provide header as a prop.
   * For complex modals, use composition with ModalContent/ModalHeader/ModalBody/ModalFooter as children.
   */
  header?: ReactNode;
  /**
   * The maximum width of the modal.
   * @default '5xl'
   */
  maxWidth?: MaxWidth;
  /**
   * Whether the modal is dismissable or not.
   * If true, the modal can't be dismissed by clicking outside of it or pressing the escape key.
   * For forms, use the isDirty prop to control the dismiss behavior.
   *
   * @default false
   */
  preventClosing?: boolean;
}

export default function Modal(props: ModalProps) {
  const {
    children,
    classNames: customClassNames,
    footer,
    header,
    maxWidth = '5xl',
    preventClosing = false,
    ...rest
  } = props;

  const classNames = useMergeClassNames(
    {
      base: ['w-full', maxWidth],
      header: 'p-4 text-lg/3',
      body: 'p-4 gap-4',
      footer: 'p-4',
    },
    customClassNames,
  );

  // Check if children contains ModalContent (composition pattern)
  const content =
    isValidElement(children) && children.type === ModalContent ? (
      children
    ) : (
      <ModalContent>
        {header && (
          <>
            <ModalHeader>{header}</ModalHeader>
            <Divider />
          </>
        )}
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </ModalContent>
    );

  return (
    <HeroUIModal
      backdrop="blur"
      classNames={classNames}
      data-test-id="Modal"
      placement="center"
      scrollBehavior="inside"
      {...rest}
      isDismissable={!preventClosing}
      isKeyboardDismissDisabled={preventClosing}
    >
      {content}
    </HeroUIModal>
  );
}

export { ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
