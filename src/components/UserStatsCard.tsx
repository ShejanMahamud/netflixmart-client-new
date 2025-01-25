import { Card, Statistic } from "antd"

interface UserStatsCardProps {
  title: string
  value: number
}

const UserStatsCard: React.FC<UserStatsCardProps> = ({ title, value }) => {
  return (
    <Card>
      <Statistic title={title} value={value} />
    </Card>
  )
}

export default UserStatsCard

