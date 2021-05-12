import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import Check from './Check';

// const gongsiUrl = "https://project-team.upbit.com/api/v1/disclosure?region=kr&per_page=";
const appUrl = "http://chsong.iptime.org:3000/upbit";

let preDisId = '';
let curDisId = '';
let disInfo = {};
let balance = '';
let inteval = null;
let checkInteval = null;

const App = (props) => {
  const [state, setState] = useState({
      gonsi : '',
      list : [],
      gongsiState : 'start',
      checkState: 'start'
  });
  async function getCode() {
      await axios.get(appUrl + '/gonsi',
          { headers: { 'Content-Type': 'application/json' } })
          .then(result => {
              setState(state => ({
                  ...state,
                  gonsi : disInfo.code
              }));
              disInfo = result.data[0];
              curDisId = disInfo.id;
          })
          .catch(err => {
            setState(state => ({
                ...state,
                gongsiState : 'start'
            }));
            alert(err);
            clearInterval(inteval);
          });
      if(preDisId == curDisId){
          return false;
      }else {
              // orderChance(0);
          if(preDisId != ''){
            alert("공시 정보 :  " + disInfo.code);
          }
          preDisId = curDisId;
          return true;
      }

  }
  async function getCheck(){
    await axios.get(appUrl + '/list',
        { headers: { 'Content-Type': 'application/json' } })
        .then(result => {
            setState(state => ({
                ...state,
                list : result.data
            }));
        })
  }
  function start(){
      inteval = setInterval(getCode, 100);
  }
  function checkingStart(){
      checkInteval = setInterval(getCheck, 100);
  }
  function gettingStart(){
    if(state.gongsiState =='stop'){
      alert("공시체크 중지");
      setState(state => ({
          ...state,
          gongsiState : 'start'
      }));
      clearInterval(inteval);
    }else{
      alert("공시체크 시작");
      setState(state => ({
          ...state,
          gongsiState : 'stop'
      }));
      start();
    }
  }
  function checkStart(){
    if(state.checkState =='stop'){
      alert("시세체크 중지");
      setState(state => ({
          ...state,
          checkState : 'start'
      }));
      clearInterval(checkInteval);
    }else{
      alert("시세체크 시작");
      setState(state => ({
          ...state,
          checkState : 'stop'
      }));
      checkingStart();
    }
  }
  return (
    <div className="App">
      <div className="Gongsi">
        <button type="button" onClick={gettingStart}>
          공시 체크 {state.gongsiState}
        </button>
        <button type="button" onClick={checkStart}>
          시세 체크 {state.checkState}
        </button>
      </div>

      <div className="divTable" >
          <div className="divTableRow">
            <div className="divTableCell cell_2">현재 공시 :{state.gonsi} </div>
          </div>
      </div>

        <Check
          { ...{
            ...props,
            list : state.list
          }}
          ></Check>
    </div>
  );
};
export default App;
