import styled from 'styled-components';
import Button from './Components/Button/Button';
import client from './js/client';

client();

const Container = styled.div`
  width: 100%;
  margin-top: 100px;
`

const Buttons = styled.div`
  width: 50%;
  margin: 0 auto;
  display: flex;
  justify-content: space-evenly;
  align-self: center;
`

function App() {
  return (
    // пробовал добавить запуск/остановку по нажатию, на данный момент не смог, пока просто висит интерфейс
    <Container className="container">
      <Buttons> 
        <Button value={'Начать запись'} />
        <Button value={'Остановить запись'} />
      </Buttons>
    </Container>    
  );
}

export default App;
