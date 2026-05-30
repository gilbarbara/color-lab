'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';

import Feedback from '~/components/Feedback';

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Feedback type="not-found">
        <Button as={Link} color="primary" href="/">
          Go to generator
        </Button>
      </Feedback>
    </div>
  );
}
