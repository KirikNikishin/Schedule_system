// src/withRouter.js
import { useNavigate } from 'react-router-dom';

export function withRouter(Component) {
  return function ComponentWithRouterProp(props) {
    const navigate = useNavigate();
    return <Component {...props} navigate={navigate} />;
  };
}
