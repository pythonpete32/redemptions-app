import React, { Component } from 'react'
import { Text, TextInput, Button, Slider, breakpoint } from '@aragon/ui'
import styled from 'styled-components'

import RedeemTokenList from '../RedeemTokenList'
import { ErrorMessage, InfoMessage } from '../Message'
import { formatTokenAmount, toDecimals, safeDiv, fromDecimals, round } from '../../lib/math-utils'

const MAX_INPUT_DECIMAL_BASE = 6

function getTokenExchange(tokens, amount, totalSupply) {
  return tokens.map(t => safeDiv(amount * t.amount, totalSupply))
}

function formatAmount(amount, decimals) {
  const rounding = Math.min(MAX_INPUT_DECIMAL_BASE, decimals)
  return formatTokenAmount(amount, false, decimals, false, { rounding })
}

class RedeemTokens extends Component {
  state = {
    amount: {
      value: formatAmount(this.props.balance, this.props.decimals),
      max: formatAmount(this.props.balance, this.props.decimals),
      error: null,
    },
    progress: 1,
  }

  //react to account balance changes
  componentDidUpdate(prevProps) {
    if (prevProps.balance != this.props.balance) {
      this.setState(({ amount }) => ({
        amount: { ...amount, max: this.props.balance },
      }))

      //recalculate new amount based on same progress and new balance
      this.handleSliderChange(this.state.progress)
    }
  }

  handleAmountChange = event => {
    const { balance, decimals } = this.props
    const formattedBalance = formatAmount(balance, decimals)

    const amount = Math.min(event.target.value, formattedBalance)
    const progress = safeDiv(amount, formattedBalance)

    this.updateAmount(String(amount), progress)
  }

  handleSliderChange = progress => {
    const { balance, decimals } = this.props
    const formattedBalance = formatAmount(balance, decimals)

    const rounding = Math.min(MAX_INPUT_DECIMAL_BASE, decimals)
    const amount = round(progress * formattedBalance, rounding)

    this.updateAmount(String(amount), progress)
  }

  updateAmount = (value, progress) => {
    this.setState(({ amount }) => ({
      amount: { ...amount, value },
      progress,
    }))
  }

  handleFormSubmit = event => {
    event.preventDefault()

    const { decimals } = this.props
    const { amount } = this.state

    this.props.onRedeemTokens(toDecimals(amount.value, decimals))
  }

  render() {
    const { amount, progress } = this.state
    const { balance, symbol, decimals, totalSupply, tokens } = this.props

    const formattedBalance = formatAmount(balance, decimals)
    const formattedSupply = formatAmount(totalSupply, decimals)

    const youGet = getTokenExchange(tokens, amount.value, totalSupply / Math.pow(10, decimals))

    const minTokenStep = fromDecimals('1', Math.min(MAX_INPUT_DECIMAL_BASE, decimals))

    const errorMessage = amount.error

    return (
      <div>
        <form onSubmit={this.handleFormSubmit}>
          <InfoMessage title={'Redeemption action'} text={`This action will redeem ${amount.value} tokens`} />
          <TokenInfo>
            You have{' '}
            <Text weight="bold">
              {formattedBalance} out of a total of {formattedSupply} {symbol}{' '}
            </Text>{' '}
            tokens for redemption
          </TokenInfo>
          <Wrapper>
            <SliderWrapper label="Amount to redeem">
              <Slider value={progress} onUpdate={this.handleSliderChange} />
            </SliderWrapper>
            <InputWrapper>
              <TextInput.Number
                name="amount"
                wide={false}
                value={amount.value}
                max={amount.max}
                min={'0'}
                step={minTokenStep}
                onChange={this.handleAmountChange}
                required
              />
              <Text size="large">{symbol}</Text>
            </InputWrapper>
          </Wrapper>
          {tokens.length > 0 ? (
            <RedeemTokenList tokens={tokens} youGet={youGet} />
          ) : (
            <Info>No tokens for redemption</Info>
          )}

          {/* <InfoMessage
            text="You'll have to sign a message first for security purposes."
            background={theme.infoPermissionsBackground}
          /> */}
          <Button mode="strong" wide={true} type="submit" disabled={amount.value <= 0 || tokens.length === 0}>
            {'Redeem tokens'}
          </Button>
          {errorMessage && <ErrorMessage message={errorMessage} />}
        </form>
      </div>
    )
  }
}
export default RedeemTokens

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #eaf6f6;
  border-top: 1px solid #eaf6f6;
  padding: 20px 0px;
`

const SliderWrapper = styled.div`
  flex-basis: 50%;
  > :first-child {
    min-width: 150px;
    padding-left: 0;
    ${breakpoint(
      'medium',
      `
     min-width: 200px;
   `
    )}
  }
`
const InputWrapper = styled.div`
  flex-basis: 50%;
  display: flex;
  align-items: center;
  justify-content: space-evenly;

  > :first-child {
    width: 75%;
  }
`

const Info = styled.div`
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
`

const TokenInfo = styled.div`
  padding: 20px 0;
`
