import React from "react"
import { Card, CardActions, CardContent, CardHeader, Link } from "@material-ui/core";


export default () => {
	return (
		<div>
			<Card>
				<CardHeader title="About" />
				<CardContent>To find out more about centering prayer, visit <Link underline='always' color='inherit' href="https://www.contemplative.org/contemplative-practice/centering-prayer/">www.contemplative.org.</Link></CardContent>
			</Card>
		</div>
	)
}