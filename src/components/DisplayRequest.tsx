import * as React from "react";
import styled from "styled-components";
import { convertHexToUtf8 } from "@walletconnect/utils";
import Column from "./Column";
import Button from "./Button";
// import { sha256 } from "../helpers/dapplet-lib";
import { apiFetchDapplet } from 'src/helpers/api';

const SRequestValues = styled.div`
  font-family: monospace;
  width: 100%;
  font-size: 12px;
  background-color: #eee;
  padding: 8px;
  word-break: break-word;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const SConnectedPeer = styled.div`
  display: flex;
  align-items: center;
  & img {
    width: 40px;
    height: 40px;
  }
  & > div {
    margin-left: 10px;
  }
`;

const SActions = styled.div`
  margin: 0;
  margin-top: 20px;

  display: flex;
  justify-content: space-around;
  & > * {
    margin: 0 5px;
  }
`;

class DisplayRequest extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { renderedDapplet: null };
  }

  public componentDidMount() {
    const me = this;
    const { displayRequest } = me.props;
    if (displayRequest.method === 'wallet_loadDapplet') {
      const dappletId = displayRequest.params[0];
      apiFetchDapplet(dappletId).then(dapplet => {
        // metaTx.tweetHash = sha256([metaTx.text])
        let template = dapplet.template;
        const metaTx = displayRequest.params[1];
        displayRequest.params[2] = dapplet.createTx(metaTx);

        // template rendering 
        for (const key in metaTx) {
          if (key) {
            const value = metaTx[key];
            template = template.replace('{{' + key + '}}', value);
          }
        }
        console.log('template', template); // tslint:disable-line
        me.setState({ renderedDapplet: template });
      });
    }
  }

  public render() {
    const {
      displayRequest,
      peerMeta,
      approveRequest,
      rejectRequest
    } = this.props;

    let params = [{ label: "Method", value: displayRequest.method }];

    switch (displayRequest.method) {
      case "eth_sendTransaction":
        params = [
          ...params,
          { label: "From", value: displayRequest.params[0].from },
          { label: "To", value: displayRequest.params[0].to },
          {
            label: "Gas",
            value:
              displayRequest.params[0].gas || displayRequest.params[0].gasLimit
          },
          { label: "Gas Price", value: displayRequest.params[0].gasPrice },
          { label: "Nonce", value: displayRequest.params[0].nonce },
          { label: "Value", value: displayRequest.params[0].value },
          { label: "Data", value: displayRequest.params[0].data }
        ];
        break;

      case "eth_sign":
        params = [
          ...params,
          { label: "Address", value: displayRequest.params[0] },
          { label: "Message", value: displayRequest.params[1] }
        ];
        break;
      case "personal_sign":
        params = [
          ...params,
          { label: "Address", value: displayRequest.params[0] },
          {
            label: "Message",
            value: convertHexToUtf8(displayRequest.params[1])
          }
        ];
        break;

      // ToDo: DiP: load dapplet txMeta 
      case "wallet_loadDapplet":
        break;

      default:
        params = [
          ...params,
          {
            label: "params",
            value: JSON.stringify(displayRequest.params, null, "\t")
          }
        ];
        break;
    }
    return (
      <Column>
        <h6>{"Request From"}</h6>
        <SConnectedPeer>
          <img src={peerMeta.icons[0]} alt={peerMeta.name} />
          <div>{peerMeta.name}</div>
        </SConnectedPeer>
        {params.map(param => (
          <React.Fragment key={param.label}>
            <h6>{param.label}</h6>
            <SRequestValues>{param.value}</SRequestValues>
          </React.Fragment>
        ))}
        {
          (this.state.renderedDapplet) ? <div>
            <h6>{"Dapplet"}</h6>
            <div dangerouslySetInnerHTML={{ __html: this.state.renderedDapplet }} />
          </div> : null
        }

        <SActions>
          <Button onClick={approveRequest}>{`Approve`}</Button>
          <Button onClick={rejectRequest}>{`Reject`}</Button>
        </SActions>
      </Column>
    );
  }
}

export default DisplayRequest;
