package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

/**
 * 车慧达货车评分
 */
@Data
public class CheHDTrackTrancheScoreDtoMG {

    /**
     * 三者分档预测(车辆风险)
     */
    private String threeTranche;

    /**
     * 三者+车损分档预测
     */
    private String totalTranche;
}
