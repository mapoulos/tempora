import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import {
	decrement,
	increment,
	incrementByAmount,
	selectCount
} from './counterSlice'

export function Counter() {
	const count = useSelector(selectCount)
	const dispatch = useDispatch()
	const [incrementAmount, setIncrementAmount] = useState(2)

	return (
		<div>
			<p>{count}</p>
			<button onClick={() => dispatch(increment())}>+</button>
			<button onClick={() => dispatch(decrement())}>-</button>
			<input value={incrementAmount} onChange={(e) => setIncrementAmount(parseInt(e.target.value))}></input>
			<button onClick={() => dispatch(incrementByAmount(incrementAmount))}>+</button>
			<button onClick={() => dispatch(incrementByAmount(-incrementAmount))}>-</button>
		</div>
	);
}