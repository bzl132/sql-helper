package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;

/**
 * @Descript 信保-关联履约义务人
 * @auth lyr
 * @date 2023/12/3 16:16
 */
@Data
public class DebtorMG implements Serializable {
    private static final long serialVersionUID = -3264403026844339527L;
    /**
     * 姓名
     */
    private String participantName;
    /**
     * 证件号
     */
    private String certNo;

}
