import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box } from '@mui/material';

interface FloatingScrollbarProps {
  scrollContainerId?: string;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

const FloatingScrollbar: React.FC<FloatingScrollbarProps> = ({
  scrollContainerId,
  scrollContainerRef,
}) => {
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartScrollLeft, setDragStartScrollLeft] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);

  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (scrollContainerRef?.current) {
      return scrollContainerRef.current;
    }
    if (scrollContainerId) {
      return document.getElementById(scrollContainerId);
    }
    const tableContainers = document.querySelectorAll('[class*="TableContainer"], .MuiTableContainer-root, [role="table"]');
    for (let i = 0; i < tableContainers.length; i++) {
      const container = tableContainers[i] as HTMLElement;
      if (container.scrollWidth > container.clientWidth) {
        return container;
      }
    }
    return null;
  }, [scrollContainerId, scrollContainerRef]);

  useEffect(() => {
    const updateScrollbar = () => {
      const container = getScrollContainer();
      containerRef.current = container;
      
      if (!container) {
        setScrollWidth(0);
        setClientWidth(0);
        setScrollLeft(0);
        return;
      }

      const width = container.scrollWidth;
      const client = container.clientWidth;
      const left = container.scrollLeft;

      setScrollWidth(width);
      setClientWidth(client);
      setScrollLeft(left);
    };

    const checkIfAtBottom = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const threshold = 100; // Hide when within 100px of bottom
      
      const isNearBottom = scrollTop + windowHeight >= documentHeight - threshold;
      setIsAtBottom(isNearBottom);
    };

    const checkScrollPosition = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollThreshold = 100; // Show scrollbar after scrolling 100px down
      setHasScrolledDown(scrollTop > scrollThreshold);
    };

    const timeoutId = setTimeout(() => {
      updateScrollbar();
      checkIfAtBottom();
      checkScrollPosition();
    }, 100);

    // Update on scroll
    const container = getScrollContainer();
    if (container) {
      const handleScroll = () => {
        updateScrollbar();
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      

      const resizeObserver = new ResizeObserver(() => {
        updateScrollbar();
      });
      resizeObserver.observe(container);

      window.addEventListener('resize', () => {
        updateScrollbar();
        checkIfAtBottom();
        checkScrollPosition();
      });

      window.addEventListener('scroll', () => {
        checkIfAtBottom();
        checkScrollPosition();
      }, { passive: true });

      const mutationObserver = new MutationObserver(() => {
        updateScrollbar();
        checkIfAtBottom();
        checkScrollPosition();
      });
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('scroll', checkIfAtBottom);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        window.removeEventListener('resize', updateScrollbar);
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [getScrollContainer]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scrollWidth <= clientWidth) return;
    
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartScrollLeft(scrollLeft);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || scrollWidth <= clientWidth) return;

      const container = containerRef.current || getScrollContainer();
      if (!container) return;

      const deltaX = e.clientX - dragStartX;
      const scrollbarWidth = scrollbarRef.current?.clientWidth || clientWidth;
      const scrollRatio = scrollWidth / scrollbarWidth;
      const scrollDelta = deltaX * scrollRatio;

      const newScrollLeft = Math.max(
        0,
        Math.min(scrollWidth - clientWidth, dragStartScrollLeft + scrollDelta)
      );

      container.scrollLeft = newScrollLeft;
      setScrollLeft(newScrollLeft);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStartX, dragStartScrollLeft, scrollWidth, clientWidth, getScrollContainer]);

  const handleScrollbarClick = (e: React.MouseEvent) => {
    if (scrollWidth <= clientWidth || isDragging) return;

    const scrollbar = scrollbarRef.current;
    if (!scrollbar) return;

    const container = containerRef.current || getScrollContainer();
    if (!container) return;

    const rect = scrollbar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scrollbarWidth = scrollbar.clientWidth;
    const scrollRatio = clickX / scrollbarWidth;
    const newScrollLeft = scrollRatio * (scrollWidth - clientWidth);

    container.scrollLeft = newScrollLeft;
    setScrollLeft(newScrollLeft);
  };


  if (scrollWidth <= clientWidth) {
    return null;
  }


  const scrollbarTrackWidth = typeof window !== 'undefined' ? window.innerWidth : clientWidth;
  const calculatedThumbWidthPercent = (clientWidth / scrollWidth) * 100;
  const minThumbWidthPx = 20; 
  const minThumbWidthPercent = (minThumbWidthPx / scrollbarTrackWidth) * 100;
  const thumbWidth = Math.max(calculatedThumbWidthPercent, minThumbWidthPercent);
  

  const maxThumbLeft = 100 - thumbWidth;
  const scrollRatio = scrollLeft / (scrollWidth - clientWidth);
  const thumbLeft = scrollRatio * maxThumbLeft;

  return (
    <Box
      ref={scrollbarRef}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '17px', 
        backgroundColor: 'transparent', 
        zIndex: 1200, 
        cursor: 'default',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        opacity: (isAtBottom || !hasScrolledDown) ? 0 : 1,
        transform: (isAtBottom || !hasScrolledDown) ? 'translateY(17px)' : 'translateY(0)',
        pointerEvents: (isAtBottom || !hasScrolledDown) ? 'none' : 'auto',
        '&:hover': {
          '& .scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
      onMouseDown={handleScrollbarClick}
    >
      <Box
        className="scrollbar-thumb"
        sx={{
          position: 'absolute',
          left: `${thumbLeft}%`,
          width: `${thumbWidth}%`,
          height: '11px',
          top: '3px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', 
          borderRadius: '10px', 
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'background-color 0.2s ease, left 0.1s ease',
          border: '1px solid rgba(0, 0, 0, 0.1)', 
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', 
          minWidth: '20px', 
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderColor: 'rgba(0, 0, 0, 0.15)',
          },
          '&:active': {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        }}
        onMouseDown={handleMouseDown}
      />
    </Box>
  );
};

export default FloatingScrollbar;

