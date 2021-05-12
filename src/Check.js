import React, {useState, useMemo} from 'react';
import crypto from 'crypto';
import sign from 'jsonwebtoken/sign';
import queryEncode from "querystring/encode";
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import './App.css';

let selList = [];
let checkList = [];
const Check = (props) => {

    const orderUrl = "https://api.upbit.com/v1/orders";
    const accountUrl = "https://api.upbit.com/v1/accounts";
    let interval = null;
    const [state, setState] = useState({
      check : '매수 : ',
      sel : '매도 : ',
      publicKey : '',
      secretKey : '',
      mmFlag: false,
      findCode: '',
      condition: 2,
      rate: 0.5
    });
    const [checkedItems, setCheckedItems] = useState(new Set());
    const checkedItemHandler = (id, isChecked) => {
      if (isChecked) {
        checkedItems.add(id);
        setCheckedItems(checkedItems);
      } else if (!isChecked && checkedItems.has(id)) {
        checkedItems.delete(id);
        setCheckedItems(checkedItems);
      }
    };
    const getDate = () => {
      let today = new Date();

      let date = today.getDate();  // 날짜
      let time = today.getTime();

      return date + " " + time;
    }
    const checkList = props.list;

    const rows = useMemo(() => {
     return props.list.map(item => {
       if(Number(item.per) > state.condition){
         console.log(checkedItems.has(item.code));
         if(state.mmFlag && checkedItems.has(item.code)){
           orderChance(0, item.code);
         }
       }
       if(state.findCode == '' || item.code.includes(state.findCode)){
         const row = selList.find(function(element){
            return item.code.includes(element.code)
         })
         let classNameCheck = 'divTableCell cell_1';
         if(item.per.indexOf('-') > -1){
           classNameCheck += ' blue';
         }else{
           classNameCheck += ' red';
         }
         if(row !== undefined){
           const rowPrice = row.price;
           const curPay = item.curPay;
           const ratePay = (Number(curPay)/Number(rowPrice)) - 1
           if( ratePay < -0.02){
             if(state.check.includes(item.code) && checkedItems.has(item.code)){
                orderChance(1, item.code);
             }
           }
           if(row.highPrice !== undefined){
             if(row.highPrice > item.curPay){
               const rateHighPay = (Number(curPay)/Number(row.highPrice)) - 1
               if( rateHighPay < -0.05){
                 if(state.check.includes(item.code) && checkedItems.has(item.code)){
                   orderChance(1, item.code);
                 }
               }
             }else{
               row.highPrice = item.curPay;
               const rowIndex = selList.map(function(d) {return d['code']}).indexOf(row.code);
               selList.splice(rowIndex,1,row);
             }
           }else{
             row.highPrice = item.curPay;
             const rowIndex = selList.map(function(d) {return d['code']}).indexOf(row.code);
             selList.splice(rowIndex,1,row);
           }

           const checkHandler = ({ target }) => {
             checkedItemHandler(item.code, target.checked);
           };
           let flag = false;
           if(checkedItems.has(item.code)){
             flag = true;
           }
           return(
             <tr key={item.code} className="divTableRow">
               <td className="divTableCell cell_1">
                 <input type="checkbox" checked={flag} onChange={(e) => checkHandler(e)}/>
               </td>
               <td colSpan='2' className="divTableCell cell_2"> {item.code}</td>
               <td className="divTableCell cell_1"> {item.curPay}</td>
               <td className="divTableCell cell_1"> {item.prePay}</td>
               <td className={classNameCheck}> {item.per} %</td>
               <td className={classNameCheck}> {rowPrice} {row.code} / {row.highPrice}</td>
             </tr>
           )
         }else{
           const checkHandler = ({ target }) => {
             checkedItemHandler(item.code, target.checked);
           };
           let flag = false;
           if(checkedItems.has(item.code)){
             flag = true;
           }
           return(
             <tr key={item.code} className="divTableRow">
               <td className="divTableCell cell_1">
                 <input type="checkbox" checked={flag} onChange={(e) => checkHandler(e)}/>
               </td>
               <td colSpan='2' className="divTableCell cell_2"> {item.code}</td>
               <td className="divTableCell cell_1"> {item.curPay}</td>
               <td className="divTableCell cell_1"> {item.prePay}</td>
               <td className={classNameCheck}> {item.per} %</td>
               <td className="divTableCell cell_1"> </td>
             </tr>
           )
         }
        }
     })
   }, [props.list, state.findCode]);

   async function getList(){
     if(state.publicKey != '' && state.secretKey != ''){
       const payload = {
           access_key: state.publicKey,
           nonce: uuidv4(),
       }
       const token = sign(payload, state.secretKey)
       await axios.get(accountUrl,
           { headers: { 'Content-Type': 'application/json' ,
           'Authorization': 'Bearer '+token} })
           .then(result => {
             let relist = [];
             result.data.map(item => {
                if(!item.currency.includes('KRW')){
                  const con = selList.find(function(element){
                      return element.code.includes(item.currency)
                  })
                  if(con === undefined){
                    relist.push({
                      code : item.currency,
                      price : item.avg_buy_price
                    });
                  }else{
                    relist.push(con);
                  }
                }
              })
              selList = relist;
           })
           .catch(err => {
             alert(err.response.data.error.message);
           });
      }
   }
   async function selCoin(code, balance){

     const body = {
       market: code,
       side: 'ask',
       volume: balance,
       price: null,
       ord_type: 'market',
       identifier:uuidv4()
     }
     console.log(JSON.stringify(body));
     const query = queryEncode(body)
     const hash = crypto.createHash('sha512')
     const queryHash = hash.update(query, 'utf-8').digest('hex')
     const payload = {
       access_key: state.publicKey,
       nonce: uuidv4(),
       query_hash: queryHash,
       query_hash_alg: 'SHA512',
     }
     const token = sign(payload, state.secretKey)
     await axios.post(orderUrl, JSON.stringify(body),
         { headers: { 'Content-Type': 'application/json' ,
         'Authorization': 'Bearer '+token} },{json: body})
         .then(result => {
             setState(state => ({
                ...state,
                sel : state.sel + code + ":" + result.data.volume + " "
             }))
         })
   }
   async function orderChance(comp, code){
     const body = {
         market: code
     }
     const query = queryEncode(body)
     const hash = crypto.createHash('sha512')
     const queryHash = hash.update(query, 'utf-8').digest('hex')
     const payload = {
       access_key: state.publicKey,
       nonce: uuidv4(),
       query_hash: queryHash,
       query_hash_alg: 'SHA512',
     }
     const token = sign(payload, state.secretKey)
     await axios.get(orderUrl + "/chance?" + query,
         { headers: { 'Content-Type': 'application/json' ,
         'Authorization': 'Bearer '+token} })
         .then(result => {
             let balance = 0;
             balance = comp == 0 ? result.data.bid_account.balance : result.data.ask_account.balance;

             if(comp == 0){
               if(result.data.ask_account.balance > 0){

               }else{
                 orderCoin(code, balance);
               }
             }else{
                 selCoin(code, balance);
              }

         })
   }
   async function orderCoin(code, balance){
     let pr = (parseInt(balance) * state.rate) + ""
     const body = {
       market: code,
       side: 'bid',
       volume: null,
       price: pr.split('.')[0],
       ord_type: 'price',
       identifier:uuidv4()
     }
     const query = queryEncode(body)
     const hash = crypto.createHash('sha512')
     const queryHash = hash.update(query, 'utf-8').digest('hex')
     const payload = {
       access_key: state.publicKey,
       nonce: uuidv4(),
       query_hash: queryHash,
       query_hash_alg: 'SHA512',
     }
     const token = sign(payload, state.secretKey)

     if(!state.check.includes(code)){
       await axios.post(orderUrl, JSON.stringify(body),
           { headers: { 'Content-Type': 'application/json' ,
           'Authorization': 'Bearer '+token} },{json: body})
           .then(result => {
               // alert("코드 : " + code + ", 주문 금액 : " + result.data.price);
               // setTimeout(orderChance(1, code),1000);
               setState(state => ({
                  ...state,
                  check : state.check + code + ":" + result.data.price + " "
               }))
           })

     }
     getList();
   }
   const publicKeySet = (e) => {
      setState(state => ({
        ...state,
        publicKey: e.target.value
      }))
   }
   const conditionSet = (e) => {
       setState(state => ({
         ...state,
         condition: e.target.value
       }))
    }
    const rateSet = (e) => {
        setState(state => ({
          ...state,
          rate: e.target.value
        }))
     }
   const secretKeySet = (e) => {
      setState(state => ({
        ...state,
        secretKey: e.target.value
      }))
   }
   const mmClick = () => {
     if(!state.mmFlag){
       interval = setInterval(getList, 1000);
     }else{
       clearInterval(interval);
     }
     setState(state => ({
         ...state,
         mmFlag : !state.mmFlag
     }))
   }
   const findCode =(e) => {
     setState(state => ({
         ...state,
         findCode : e.target.value
     }))
   }
    return (
      <table>
        <tr className="divTableRow">
          <td className="divTableCell"></td>
          <td colSpan='3' className="divTableCell cell_2"> public Key : &nbsp;
            <input type="text" disabled={state.mmFlag} style={{
                width:'100px'
            }} onChange={publicKeySet}/> </td>
          <td colSpan='3' className="divTableCell cell_1"> secret Key : &nbsp;
            <input type="text" disabled={state.mmFlag} style={{
                width:'100px'
            }} onChange={secretKeySet}/> </td>
          </tr>
          <tr className="divTableRow">
            <td colSpan='2' className="divTableCell cell_2"> 구매조건 : &nbsp;
              <input  type="number" disabled={state.mmFlag} style={{
                  width:'100px'
              }} onChange={conditionSet} plcaeHolder="2"/> </td>
            <td colSpan='2' className="divTableCell cell_1"> 매수량 : &nbsp;
              <input  type="number" disabled={state.mmFlag} style={{
                  width:'100px'
              }} onChange={rateSet} plcaeHolder="최대 0.9"/></td>
            <td colSpan='3' className="divTableCell cell_1">
              <button onClick={mmClick}>
                자동매매 {state.mmFlag?"중지" : "시작"}
              </button>
            </td>
          </tr>
          <tr className="divTableRow">
            <td colSpan='7' className="divTableCell cell_1"> {state.check} </td>
          </tr>
          <tr className="divTableRow">
            <td colSpan='7' className="divTableCell cell_1"> {state.sel} </td>
          </tr>
          <tr className="divTableRow">
            <td className="divTableCell cell_1">선택</td>
            <td colspan='2' className="divTableCell cell_2"> 코드
                <input type="text" style={{
                    width:'100px'
                }} onChange={findCode} placeHolder="Find Code"/>
            </td>
            <td className="divTableCell cell_1"> 현재가 </td>
            <td className="divTableCell cell_1"> 5초 이전가 </td>
            <td className="divTableCell cell_1"> 등락률 </td>
            <td className="divTableCell cell_1"> 구매단가</td>
          </tr>
          {rows}

      </table>
    )
}


export default Check;
