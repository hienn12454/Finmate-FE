import { useEffect, useId, useRef, useState } from "react";
import styles from "./AvatarDropdown.module.css";

type MenuItem = {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
};

interface AvatarDropdownProps {
  avatarUrl: string;
  alt: string;
  wrapperClassName: string;
  imageClassName: string;
  menuLabel?: string;
  items: MenuItem[];
}

export default function AvatarDropdown({
  avatarUrl,
  alt,
  wrapperClassName,
  imageClassName,
  menuLabel,
  items,
}: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonId = useId();
  const menuId = useId();

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && !root.contains(e.target)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        id={buttonId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
      >
        <div className={wrapperClassName}>
          <img src={avatarUrl} alt={alt} className={imageClassName} />
        </div>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className={styles.menu}
        >
          {menuLabel ? <div className={styles.menuLabel}>{menuLabel}</div> : null}
          <div className={styles.menuList}>
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                role="menuitem"
                className={
                  item.variant === "danger"
                    ? `${styles.item} ${styles.itemDanger}`
                    : styles.item
                }
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

