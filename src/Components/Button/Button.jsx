import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: 15px;
  cursor: pointer;
`

export default function Button({ value, handler }) {
  return (
    <StyledButton onClick={handler}>
      {value}
    </StyledButton>
  )
}
