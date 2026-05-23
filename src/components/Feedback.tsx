import { type JSX, type ReactNode } from 'react';
import { cn } from '@heroui/react';
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  SmileySadIcon,
  SwatchesIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';

type FeedbackSize = 'sm' | 'md' | 'lg';
type FeedbackType = 'empty' | 'error' | 'forbidden' | 'no-results' | 'not-found' | 'success';

interface FeedbackProps {
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  hideIcon?: boolean;
  icon?: ReactNode;
  /**
   * Size of the component.
   * @default 'md'
   */
  size?: FeedbackSize;
  title?: ReactNode;
  /**
   * Predefined type of non-ideal state to display. Using null allows for fully custom content.
   * @default 'empty'
   */
  type?: FeedbackType | null;
}

const iconSizeClasses: Record<FeedbackSize, string> = {
  sm: 'size-12',
  md: 'size-16',
  lg: 'size-24',
};

const titleSizeClasses: Record<FeedbackSize, string> = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
};

interface Template {
  description: ReactNode;
  icon: ReactNode;
  title: ReactNode;
}

function getTemplate(type: FeedbackType, size: FeedbackSize): Template {
  const iconClass = `${iconSizeClasses[size]} text-muted`;

  switch (type) {
    case 'empty': {
      return {
        icon: <SwatchesIcon className={iconClass} />,
        title: 'Nothing here',
        description: 'There are no items to display.',
      };
    }
    case 'error': {
      return {
        icon: <WarningCircleIcon className={iconClass} />,
        title: 'Something went wrong',
        description: 'An unexpected error has occurred. Try reloading the page.',
      };
    }
    case 'forbidden': {
      return {
        icon: <ProhibitIcon className={iconClass} />,
        title: 'Access denied',
        description: "You don't have permission to access this resource.",
      };
    }
    case 'no-results': {
      return {
        icon: <MagnifyingGlassIcon className={iconClass} />,
        title: 'No search results',
        description: "Your search didn't match anything.",
      };
    }
    case 'not-found': {
      return {
        icon: <SmileySadIcon className={iconClass} />,
        title: 'Page not found',
        description: "We are sorry, but the page you requested doesn't exist.",
      };
    }

    case 'success':
    default: {
      return {
        icon: <CheckCircleIcon className={iconClass} />,
        title: null,
        description: 'Success',
      };
    }
  }
}

export default function Feedback(props: FeedbackProps): JSX.Element {
  const {
    children,
    className,
    description,
    hideIcon = false,
    icon,
    size = 'md',
    title,
    type = 'empty',
    ...rest
  } = props;
  const template = type ? getTemplate(type, size) : null;

  const renderedIcon = icon !== undefined ? icon : template?.icon;
  const renderedTitle = title !== undefined ? title : template?.title;
  const renderedDescription = description !== undefined ? description : template?.description;
  const hasContent = renderedTitle || renderedDescription;

  return (
    <div
      className={cn('mx-auto', 'text-center', 'w-full', 'max-w-150', 'p-4', className)}
      data-testid="Feedback"
      {...rest}
    >
      {!hideIcon && renderedIcon && (
        <div className="flex items-center justify-center">{renderedIcon}</div>
      )}

      {hasContent && (
        <div className={renderedIcon && !hideIcon ? 'mt-4' : ''}>
          {renderedTitle !== null && renderedTitle !== undefined && (
            <h2 className={`font-semibold text-foreground ${titleSizeClasses[size]}`}>
              {renderedTitle}
            </h2>
          )}
          {renderedDescription !== null && renderedDescription !== undefined && (
            <p className={`text-muted ${renderedTitle ? 'mt-1' : ''}`}>{renderedDescription}</p>
          )}
        </div>
      )}

      {children && <div className={hasContent ? 'mt-6' : ''}>{children}</div>}
    </div>
  );
}
