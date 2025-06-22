import React from "react";
import styled from "styled-components";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import { X, ChevronUp, ChevronDown } from "../Icons/Icons";
import { uuidToIndex } from "../../../lib/uuidTools";
import { useUUIDSearch } from "../../../hooks/use-uuid-search";
import { querySmallScreen, SCROLLBAR_WIDTH } from "../../../lib/constants";

const Button = styled(UnstyledButton)`
  font-size: 0.875rem;
  aspect-ratio: 1;
  max-height: 80%;
  padding: 4px;
  color: var(--neutral-700);
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-200);
    }
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  height: 2rem;
  position: fixed;
  top: 0;
  right: 4rem;
  padding: 0 0.5rem;

  /* max-width: max-content; */
  max-width: calc(100vw - ${SCROLLBAR_WIDTH}px);

  @media ${querySmallScreen} {
    right: calc(${SCROLLBAR_WIDTH}px);
  }

  transform: translateY(var(--y-offset));
  transition: transform 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);
  z-index: 1000;
  background-color: var(--slate-50);
  align-items: center;
`;

const ShowSearchButton = styled(UnstyledButton)`
  background-color: var(--slate-50);
  border-radius: 0 0 8px 8px;
  font-size: 0.875rem;
  font-family: monospace;
  padding: 0rem 1rem;

  /* transform: translateY(var(--y-offset));
  transition: transform 0.1s cubic-bezier(0.215, 0.61, 0.355, 1); */
  display: flex;
  align-items: center;

  position: absolute;
  z-index: 999;
  right: 10rem;
  color: inherit;
  @media ${querySmallScreen} {
    right: calc(${SCROLLBAR_WIDTH}px);
    bottom: 0;
    border-radius: 8px 0 0 8px;
  }

  outline: none;
  &:focus {
    outline: none;
  }
  cursor: pointer;
  transition: background-color 0.1s ease-in-out;
  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-400);
    }
  }
`;

const Input = styled.input`
  font-family: monospace;
  font-size: 1rem;
  width: 100%;
  padding: 0.25rem;
  outline: none;
  border: none;
  background-color: var(--slate-50);

  &:focus {
    outline: none;
  }
`;

const Form = styled.form`
  flex: 1 1 38ch;
  width: 38ch;
  min-width: 6ch;
`;

const Line = styled.div`
  height: 60%;
  width: 1px;
  background-color: var(--neutral-400);
  margin-right: 0.5rem;
  flex-shrink: 0;
`;

function useShiftIsHeldDown() {
  const [shiftIsHeldDown, setShiftIsHeldDown] = React.useState(false);
  React.useEffect(() => {
    const listener = (e) => setShiftIsHeldDown(e.shiftKey);
    window.addEventListener("keydown", listener);
    window.addEventListener("keyup", listener);
    return () => {
      window.removeEventListener("keydown", listener);
      window.removeEventListener("keyup", listener);
    };
  }, []);
  return shiftIsHeldDown;
}

function SearchWidget({
  setVirtualPosition,
  search,
  setSearch,
  searchDisplayed,
  setSearchDisplayed,
  displayedUUIDs,
  virtualPosition,
  MAX_POSITION,
}) {
  const inputRef = React.useRef(null);
  const cmdKey = React.useMemo(() => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    return isMac ? "metaKey" : "ctrlKey";
  }, []);
  const shiftIsHeldDown = useShiftIsHeldDown();

  const { searchUUID, currentUUID, nextUUID, previousUUID } = useUUIDSearch({
    displayedUUIDs,
    virtualPosition,
  });
  const index = React.useMemo(() => {
    if (currentUUID) {
      const index = uuidToIndex(currentUUID);

      return index;
    }
    return null;
  }, [currentUUID]);

  React.useEffect(() => {
    if (index) {
      if (index < 0n) {
        setVirtualPosition(0n);
      } else if (index >= MAX_POSITION) {
        setVirtualPosition(MAX_POSITION);
      } else {
        setVirtualPosition(index);
      }
    }
  }, [setVirtualPosition, index]);

  React.useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (!inputRef.current) {
        return;
      }
      if (e[cmdKey] && e.key === "f") {
        e.preventDefault();
        if (searchDisplayed) {
          // check if the input is focused
          if (document.activeElement === inputRef.current) {
            // nothing
          } else {
            inputRef.current.focus();
          }
        } else {
          setSearchDisplayed(true);
          inputRef.current.focus();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSearchDisplayed(false);
      }
    });
  }, [searchDisplayed, cmdKey]);

  return (
    <>
      <ShowSearchButton
        onClick={() => {
          if (!searchDisplayed && inputRef.current) {
            inputRef.current.focus();
          }
          setSearchDisplayed((prev) => !prev);
        }}
      >
        search!
      </ShowSearchButton>
      <Wrapper style={{ "--y-offset": searchDisplayed ? "0" : "-110%" }}>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            if (shiftIsHeldDown) {
              previousUUID();
            } else {
              nextUUID();
            }
          }}
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for a password"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              searchUUID(e.target.value);
            }}
          />
        </Form>
        <Line />
        <Button onClick={() => previousUUID()}>
          <ChevronUp style={{ height: "100%", width: "100%" }} />
        </Button>
        <Button onClick={() => nextUUID()}>
          <ChevronDown style={{ height: "100%", width: "100%" }} />
        </Button>
        <Button onClick={() => setSearchDisplayed(false)}>
          <X style={{ height: "100%", width: "100%" }} />
        </Button>
      </Wrapper>
    </>
  );
}

export default SearchWidget;
