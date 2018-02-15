// reputationA = ave(theirTrustToA[i] * reputation[i])
// reporeA = ave(theirTrustToA[i] * myTrustTo[i])
// trust = good results / (bad results * riskFactor)

export class RRT {
  static members: RRT[] = []
  static penaltyFactor = 100

  id: string
  reputation = 1
  jobDone = 0
  trusts: {[key: string]: number} = {}

  constructor () {
    this.id = String(RRT.members.length)
    RRT.members.push(this)
  }

  calcReputation() {
    let acc = 0
    let trusts = 0
    for (let member of RRT.members) {
      if (this.id in member.trusts) {
        if (member.reputation >= 1) {
          trusts++

          acc += member.trusts[this.id] * member.reputation
        }
      }
    }
    if (trusts > 0) {
      this.reputation = acc / trusts
    }

    return this.reputation
  }

  calcRepore(
    a: RRT
  ) {
    let acc = 0
    let trusts = 0
    for (let id in this.trusts) {
      let member = RRT.members[+id]
      if (a.id in member.trusts) {
        if (member.reputation >= 1) {
          trusts++

          acc += member.trusts[a.id] * member.reputation
        }
      }
    }
    return acc / trusts
  }

  doGood(
    a: RRT
  ) {
    a.trusts[this.id] = a.trusts[this.id] || 0
    a.trusts[this.id]++

    this.jobDone++

    this.calcReputation()

    return this
  }

  doBad(
    a: RRT
  ) {
    a.trusts[this.id] = a.trusts[this.id] || 0
    a.trusts[this.id] -= 1 + this.jobDone / RRT.penaltyFactor

    this.jobDone++

    this.calcReputation()

    return this
  }
}
